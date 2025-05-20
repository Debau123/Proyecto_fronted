"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";

export default function AdminCarta() {
  const [productos, setProductos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [step, setStep] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState("");

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
  const [ingredientesNuevos, setIngredientesNuevos] = useState([]);
  const [ingredientesUsados, setIngredientesUsados] = useState([]);
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos?populate=imagen`)
      .then((res) => res.json())
      .then((data) => setProductos(data.data));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredientes`)
      .then((res) => res.json())
      .then((data) => setIngredientes(data.data));
  }, []);

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNuevoProducto({ ...nuevoProducto, imagen: file });
    }
  };

  const agregarIngredienteNuevo = async () => {
    if (nuevoIngrediente.nombre && nuevoIngrediente.unidad) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: nuevoIngrediente }),
        });

        const data = await res.json();

        setIngredientesNuevos([...ingredientesNuevos, { ...nuevoIngrediente }]);
        setIngredientes([...ingredientes, data.data]);
        setNuevoIngrediente({ nombre: "", unidad: "", stock_actual: "", stock_minimo: "" });
      } catch (error) {
        console.error("Error al crear ingrediente:", error);
      }
    }
  };

  const agregarIngredienteUsado = () => {
    if (ingredienteSeleccionado && cantidadSeleccionada) {
      setIngredientesUsados([
        ...ingredientesUsados,
        {
          id: parseInt(ingredienteSeleccionado),
          cantidad: parseFloat(cantidadSeleccionada),
        },
      ]);
      setIngredienteSeleccionado("");
      setCantidadSeleccionada("");
    }
  };

  const crearTodo = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.imagen) {
      setError("Faltan campos obligatorios.");
      return;
    }

    // Subir imagen
    const formData = new FormData();
    formData.append("files", nuevoProducto.imagen);
    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    const imagenId = uploadData[0].id;

    // Crear receta
    const recetaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recetas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { descripcion: recetaDescripcion } }),
    });
    const recetaData = await recetaRes.json();
    const recetaId = recetaData.data.id;

    // Crear producto
    const prodRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          nombre: nuevoProducto.nombre,
          descripcion: nuevoProducto.descripcion,
          precio: parseFloat(nuevoProducto.precio),
          categoria: nuevoProducto.categoria,
          receta: recetaId,
          imagen: imagenId,
        },
      }),
    });
    const prodData = await prodRes.json();

    // Crear receta_ingredientes
    for (const ing of ingredientesUsados) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/receta_ingredientes`, {
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

    // Reset
    setModalAbierto(false);
    setStep(1);
    setNuevoProducto({ nombre: "", descripcion: "", precio: "", imagen: null, categoria: "entrante" });
    setRecetaDescripcion("");
    setIngredientesUsados([]);
    setIngredientesNuevos([]);
    setNuevoIngrediente({ nombre: "", unidad: "", stock_actual: "", stock_minimo: "" });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos?populate=imagen`)
      .then((res) => res.json())
      .then((data) => setProductos(data.data));
  };

  const renderPaso = () => {
    if (step === 1) {
      return (
        <div className="grid gap-3">
          <input placeholder="Nombre" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} className="border rounded px-2 py-1" />
          <textarea placeholder="Descripción" value={nuevoProducto.descripcion} onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })} className="border rounded px-2 py-1" />
          <input type="number" placeholder="Precio" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} className="border rounded px-2 py-1" />
          <select value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })} className="border rounded px-2 py-1">
            <option value="entrante">Entrante</option>
            <option value="principal">Principal</option>
            <option value="postre">Postre</option>
          </select>
          <input type="file" accept="image/*" onChange={handleImagen} className="border rounded px-2 py-1" />
          <Button onClick={() => setStep(2)}>Siguiente</Button>
        </div>
      );
    } else if (step === 2) {
      return (
        <div className="grid gap-3">
          <textarea placeholder="Descripción de la receta" value={recetaDescripcion} onChange={(e) => setRecetaDescripcion(e.target.value)} className="border rounded px-2 py-1" />
          <Button onClick={() => setStep(3)}>Siguiente</Button>
        </div>
      );
    } else if (step === 3) {
      return (
        <div className="grid gap-3">
          <input placeholder="Nombre" value={nuevoIngrediente.nombre} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, nombre: e.target.value })} className="border rounded px-2 py-1" />
          <input placeholder="Unidad" value={nuevoIngrediente.unidad} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, unidad: e.target.value })} className="border rounded px-2 py-1" />
          <input placeholder="Stock actual" value={nuevoIngrediente.stock_actual} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, stock_actual: e.target.value })} className="border rounded px-2 py-1" />
          <input placeholder="Stock mínimo" value={nuevoIngrediente.stock_minimo} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, stock_minimo: e.target.value })} className="border rounded px-2 py-1" />
          <Button onClick={agregarIngredienteNuevo}>Añadir ingrediente</Button>
          <ul className="text-sm text-gray-700 list-disc pl-4">
            {ingredientesNuevos.map((i, idx) => (
              <li key={idx}>
                {i.nombre} ({i.unidad})
              </li>
            ))}
          </ul>
          <Button onClick={() => setStep(4)}>Siguiente</Button>
        </div>
      );
    } else if (step === 4) {
      return (
        <div className="grid gap-3">
          <select value={ingredienteSeleccionado} onChange={(e) => setIngredienteSeleccionado(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Selecciona ingrediente</option>
            {ingredientes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.attributes.nombre}
              </option>
            ))}
          </select>
          <input type="number" placeholder="Cantidad usada" value={cantidadSeleccionada} onChange={(e) => setCantidadSeleccionada(e.target.value)} className="border rounded px-2 py-1" />
          <Button onClick={agregarIngredienteUsado}>Añadir a receta</Button>
          <ul className="text-sm text-gray-700 list-disc pl-4">
            {ingredientesUsados.map((i, idx) => (
              <li key={idx}>Ingrediente ID {i.id} - {i.cantidad} unidades</li>
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
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Carta</h1>
          <Dialog open={modalAbierto} onOpenChange={(o) => { setModalAbierto(o); setStep(1); }}>
            <DialogTrigger asChild><Button>Nuevo</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Crear nuevo plato</DialogTitle></DialogHeader>
              {renderPaso()}
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {productos.map((p) => (
            <Card key={p.id} className="p-4">
              {p.attributes.imagen?.data?.attributes?.url && (
                <img src={process.env.NEXT_PUBLIC_API_URL + p.attributes.imagen.data.attributes.url} alt={p.attributes.nombre} className="w-full h-40 object-cover rounded mb-2" />
              )}
              <h3 className="text-lg font-bold">{p.attributes.nombre}</h3>
              <p className="text-sm">{p.attributes.descripcion}</p>
              <p className="text-right font-semibold mt-2">{p.attributes.precio} €</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
