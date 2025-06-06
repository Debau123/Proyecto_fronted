"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { TrashIcon } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { API_URL } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import withAdminOnly from "@/lib/withAdminOnly";


function AdminCarta() {
  const [productos, setProductos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [step, setStep] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState("");
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingIngredientes, setLoadingIngredientes] = useState(false);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    imagen: null,
    categoria: "entrante",
  });
  const [recetaDescripcion, setRecetaDescripcion] = useState("");
  const [nuevoIngrediente, setNuevoIngrediente] = useState({
    nombre: "",
    unidad: "",
    stock_actual: "",
    stock_minimo: "",
  });
  const [ingredientesUsados, setIngredientesUsados] = useState([]);
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState("");

  // Cargar productos con loading y error
  const cargarProductos = async () => {
    setLoadingProductos(true);
    try {
      const res = await fetch(`${API_URL}/api/productos?populate=imagen,receta`);
      const data = await res.json();
      setProductos(data.data);
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoadingProductos(false);
    }
  };

  // Cargar ingredientes con loading y error
  const cargarIngredientes = async () => {
    setLoadingIngredientes(true);
    try {
      const res = await fetch(`${API_URL}/api/ingredientes`);
      const data = await res.json();
      setIngredientes(data.data);
    } catch {
      toast.error("Error al cargar ingredientes");
    } finally {
      setLoadingIngredientes(false);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarIngredientes();
  }, []);

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) setNuevoProducto({ ...nuevoProducto, imagen: file });
  };

  // Añadir ingrediente nuevo con toast.promise
  const agregarIngredienteNuevo = async () => {
    if (!nuevoIngrediente.nombre || !nuevoIngrediente.unidad) {
      toast.error("Nombre y unidad son obligatorios para el ingrediente");
      return;
    }
    try {
      await toast.promise(
        fetch(`${API_URL}/api/ingredientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: nuevoIngrediente }),
        }),
        {
          loading: "Creando ingrediente...",
          success: "Ingrediente creado",
          error: "Error al crear ingrediente",
        }
      ).then(async (res) => {
        const data = await res.json();
        setIngredientes((prev) => [...prev, data.data]);
        setIngredienteSeleccionado(data.data.id.toString());
        setNuevoIngrediente({ nombre: "", unidad: "", stock_actual: "", stock_minimo: "" });
      });
    } catch (e) {
      // error handled by toast.promise
    }
  };

  // Añadir ingrediente usado a la lista
  const agregarIngredienteUsado = () => {
    if (ingredienteSeleccionado && cantidadSeleccionada) {
      setIngredientesUsados([...ingredientesUsados, {
        id: parseInt(ingredienteSeleccionado),
        cantidad: parseFloat(cantidadSeleccionada),
      }]);
      setIngredienteSeleccionado("");
      setCantidadSeleccionada("");
    } else {
      toast.error("Selecciona ingrediente y cantidad");
    }
  };

  // Crear producto + receta + ingredientes usados con toasters y loading
  const crearTodo = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.imagen) {
      toast.error("Faltan campos obligatorios.");
      return;
    }

    try {
      toast.loading("Subiendo imagen...");
      const formData = new FormData();
      formData.append("files", nuevoProducto.imagen);
      const uploadRes = await fetch(`${API_URL}/api/upload`, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      toast.dismiss();

      toast.loading("Creando receta...");
      const recetaRes = await fetch(`${API_URL}/api/recetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { descripcion: recetaDescripcion } }),
      });
      const recetaId = (await recetaRes.json()).data.id;
      toast.dismiss();

      toast.loading("Creando producto...");
      await fetch(`${API_URL}/api/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            ...nuevoProducto,
            precio: parseFloat(nuevoProducto.precio),
            receta: recetaId,
            imagen: uploadData[0].id,
          },
        }),
      });
      toast.dismiss();

      if (ingredientesUsados.length > 0) {
        toast.loading("Guardando ingredientes usados...");
        for (const ing of ingredientesUsados) {
          await fetch(`${API_URL}/api/receta-ingredientes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: {
                receta: recetaId,
                ingrediente: ing.id,
                cantidad_necesaria: ing.cantidad,
              },
            }),
          });
        }
        toast.dismiss();
      }

      toast.success("Producto creado correctamente");
      setModalAbierto(false);
      setStep(1);
      setNuevoProducto({ nombre: "", descripcion: "", precio: "", imagen: null, categoria: "entrante" });
      setRecetaDescripcion("");
      setIngredientesUsados([]);
      setNuevoIngrediente({ nombre: "", unidad: "", stock_actual: "", stock_minimo: "" });
      cargarProductos();
      cargarIngredientes();
    } catch (error) {
      toast.dismiss();
      toast.error("Error creando el producto");
    }
  };

  // Eliminar producto + receta con toast.promise
  const eliminarProductoYReceta = async (producto) => {
    const recetaId = producto.attributes.receta?.data?.id;
    toast.promise(
      fetch(`${API_URL}/api/productos/${producto.id}`, { method: "DELETE" }),
      {
        loading: "Eliminando producto...",
        success: "Producto eliminado",
        error: "Error al eliminar producto",
      }
    ).then(async () => {
      if (recetaId) {
        await fetch(`${API_URL}/api/recetas/${recetaId}`, { method: "DELETE" });
      }
      cargarProductos();
      cargarIngredientes();
    });
  };
    const renderPaso = () => {
    if (step === 1) {
      return (
        <div className="grid gap-3">
          <input
            placeholder="Nombre"
            value={nuevoProducto.nombre}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <textarea
            placeholder="Descripción"
            value={nuevoProducto.descripcion}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Precio"
            value={nuevoProducto.precio}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <select
            value={nuevoProducto.categoria}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
            className="border rounded px-2 py-1"
          >
            <option value="entrante">Entrante</option>
            <option value="principal">Principal</option>
            <option value="postre">Postre</option>
          </select>
          <input type="file" accept="image/*" onChange={handleImagen} className="border rounded px-2 py-1" />
          <Button onClick={() => setStep(2)}>Siguiente</Button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="grid gap-3">
          <textarea
            placeholder="Descripción de la receta"
            value={recetaDescripcion}
            onChange={(e) => setRecetaDescripcion(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <Button onClick={() => setStep(3)}>Siguiente</Button>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="grid gap-3">
          <select
            value={ingredienteSeleccionado}
            onChange={(e) => setIngredienteSeleccionado(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">Selecciona ingrediente</option>
            {ingredientes.map((i) => (
              <option key={i.id} value={i.id}>{i.attributes.nombre}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Cantidad usada"
            value={cantidadSeleccionada}
            onChange={(e) => setCantidadSeleccionada(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <Button onClick={agregarIngredienteUsado}>Añadir a receta</Button>
          <hr className="my-4" />
          <p className="text-sm font-semibold">¿No está en la lista? Añádelo aquí:</p>
          <input
            placeholder="Nombre"
            value={nuevoIngrediente.nombre}
            onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, nombre: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="Unidad"
            value={nuevoIngrediente.unidad}
            onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, unidad: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="Stock actual"
            value={nuevoIngrediente.stock_actual}
            onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, stock_actual: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="Stock mínimo"
            value={nuevoIngrediente.stock_minimo}
            onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, stock_minimo: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <Button onClick={agregarIngredienteNuevo}>Crear ingrediente</Button>
          <Button onClick={() => setStep(4)}>Siguiente</Button>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="grid gap-3">
          <ul className="text-sm text-gray-700 list-disc pl-4">
            {ingredientesUsados.map((i, idx) => (
              <li key={idx}>
                Ingrediente ID {i.id} - {i.cantidad} unidades
              </li>
            ))}
          </ul>
          {error && <p className="text-red-500">{error}</p>}
          <Button onClick={crearTodo}>Finalizar</Button>
        </div>
      );
    }
  };

  return (
    <>
      <Navbar />
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Carta</h1>
          <Dialog open={modalAbierto} onOpenChange={(o) => { setModalAbierto(o); setStep(1); }}>
            <DialogTrigger asChild>
              <Button>Nuevo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear nuevo plato</DialogTitle>
              </DialogHeader>
              {renderPaso()}
            </DialogContent>
          </Dialog>
        </div>

        {loadingProductos ? (
          <p className="text-gray-600">Cargando productos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {productos.map((p) => (
              <Card key={p.id} className="p-4 relative">
                {p.attributes.imagen?.data?.attributes?.url && (
                  <img
                    src={API_URL + p.attributes.imagen.data.attributes.url}
                    alt={p.attributes.nombre}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                )}
                <h3 className="text-lg font-bold">{p.attributes.nombre}</h3>
                <p className="text-sm">{p.attributes.descripcion}</p>
                <p className="text-right font-semibold mt-2">{p.attributes.precio} €</p>
                <Button
                  variant="destructive"
                  onClick={() => eliminarProductoYReceta(p)}
                  className="mt-4 w-full"
                >
                  <TrashIcon className="w-4 h-4 mr-1" /> Eliminar
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
export default withAdminOnly(AdminCarta);

