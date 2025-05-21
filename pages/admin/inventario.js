"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Toaster, toast } from "react-hot-toast";
import { API_URL } from "@/lib/api";

export default function AdminInventario() {
  const [ingredientes, setIngredientes] = useState([]);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({
    nombre: "",
    unidad: "",
    stock_actual: "",
    stock_minimo: "",
  });
  const [cantidadAgregar, setCantidadAgregar] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [modalIngredienteAbierto, setModalIngredienteAbierto] = useState(false);

  const cargarIngredientes = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/ingredientes?pagination[pageSize]=1000&sort=nombre:ASC`
      );
      const data = await res.json();
      setIngredientes(data.data);
    } catch {
      toast.error("Error al cargar ingredientes");
    }
  };

  useEffect(() => {
    cargarIngredientes();
  }, []);

  const agregarStock = async (id) => {
    const cantidad = parseFloat(cantidadAgregar[id] || 0);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error("Introduce una cantidad válida mayor que 0");
      return;
    }

    const ingrediente = ingredientes.find((i) => i.id === id);
    const stockActual = ingrediente.attributes.stock_actual || 0;
    const nuevoStock = stockActual + cantidad;

    await toast.promise(
      fetch(`${API_URL}/api/ingredientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { stock_actual: nuevoStock } }),
      }),
      {
        loading: "Actualizando stock...",
        success: "Stock actualizado",
        error: "Error al actualizar stock",
      }
    );

    setCantidadAgregar((prev) => ({ ...prev, [id]: "" }));
    cargarIngredientes();
  };

  const crearIngrediente = async () => {
    const { nombre, unidad, stock_actual, stock_minimo } = nuevoIngrediente;
    if (!nombre || !unidad) {
      toast.error("Nombre y unidad son obligatorios");
      return;
    }

    await toast.promise(
      fetch(`${API_URL}/api/ingredientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            nombre,
            unidad,
            stock_actual: parseFloat(stock_actual) || 0,
            stock_minimo: parseFloat(stock_minimo) || 0,
            publishedAt: new Date().toISOString(),
          },
        }),
      }),
      {
        loading: "Creando ingrediente...",
        success: "Ingrediente creado",
        error: "Error al crear ingrediente",
      }
    );

    setNuevoIngrediente({ nombre: "", unidad: "", stock_actual: "", stock_minimo: "" });
    setModalIngredienteAbierto(false);
    cargarIngredientes();
  };

  const ingredientesFiltrados = ingredientes.filter((i) =>
    i.attributes.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <h1 className="text-3xl font-bold mb-6">Inventario</h1>

        <div className="flex justify-between mb-4 max-w-sm">
          <input
            className="border px-2 py-1 rounded w-full"
            placeholder="Buscar ingrediente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Dialog open={modalIngredienteAbierto} onOpenChange={setModalIngredienteAbierto}>
            <DialogTrigger asChild>
              <Button className="ml-4">Añadir ingrediente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo ingrediente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <input
                  className="border px-2 py-1 rounded w-full"
                  placeholder="Nombre"
                  value={nuevoIngrediente.nombre}
                  onChange={(e) =>
                    setNuevoIngrediente({ ...nuevoIngrediente, nombre: e.target.value })
                  }
                />
                <input
                  className="border px-2 py-1 rounded w-full"
                  placeholder="Unidad (g, ml, u)"
                  value={nuevoIngrediente.unidad}
                  onChange={(e) =>
                    setNuevoIngrediente({ ...nuevoIngrediente, unidad: e.target.value })
                  }
                />
                <input
                  className="border px-2 py-1 rounded w-full"
                  type="number"
                  placeholder="Stock actual"
                  value={nuevoIngrediente.stock_actual}
                  onChange={(e) =>
                    setNuevoIngrediente({ ...nuevoIngrediente, stock_actual: e.target.value })
                  }
                />
                <input
                  className="border px-2 py-1 rounded w-full"
                  type="number"
                  placeholder="Stock mínimo"
                  value={nuevoIngrediente.stock_minimo}
                  onChange={(e) =>
                    setNuevoIngrediente({ ...nuevoIngrediente, stock_minimo: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button onClick={crearIngrediente}>Crear ingrediente</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 mb-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {ingredientesFiltrados.map((ing) => (
            <Card
              key={ing.id}
              className={`p-4 border relative ${
                ing.attributes.stock_actual < ing.attributes.stock_minimo
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <h3 className="text-lg font-semibold mb-1">{ing.attributes.nombre}</h3>
              <p className="text-sm text-gray-700">
                Stock: {ing.attributes.stock_actual} {ing.attributes.unidad}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Mínimo: {ing.attributes.stock_minimo} {ing.attributes.unidad}
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  className="border px-2 py-1 rounded"
                  placeholder={`+ cantidad (${ing.attributes.unidad})`}
                  value={cantidadAgregar[ing.id] || ""}
                  onChange={(e) =>
                    setCantidadAgregar((prev) => ({
                      ...prev,
                      [ing.id]: e.target.value,
                    }))
                  }
                />
                <Button onClick={() => agregarStock(ing.id)}>Añadir</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
