"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import { API_URL } from "@/lib/api";
import withCocineroOnly from "@/lib/withCocineroOnly";

function InventarioCocinero() {
  const [ingredientes, setIngredientes] = useState([]);
  const [cantidadAgregar, setCantidadAgregar] = useState({});
  const [busqueda, setBusqueda] = useState("");

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

  const ingredientesFiltrados = ingredientes.filter((i) =>
    i.attributes.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <h1 className="text-3xl font-bold mb-6">Inventario (Cocinero)</h1>

        <div className="flex justify-between mb-4 max-w-sm">
          <input
            className="border px-2 py-1 rounded w-full"
            placeholder="Buscar ingrediente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
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

export default withCocineroOnly(InventarioCocinero);
