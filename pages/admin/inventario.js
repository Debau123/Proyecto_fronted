"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function AdminInventario() {
  const [ingredientes, setIngredientes] = useState([]);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({ nombre: "", unidad: "", stock_actual: "", stock_minimo: "" });
  const [cantidadAgregar, setCantidadAgregar] = useState({});
  const [busqueda, setBusqueda] = useState("");

  const cargarIngredientes = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredientes?pagination[pageSize]=1000&sort=nombre:ASC`);
    const data = await res.json();
    setIngredientes(data.data);
  };

  const agregarStock = async (id) => {
    const cantidad = parseFloat(cantidadAgregar[id] || 0);
    if (isNaN(cantidad) || cantidad <= 0) return;

    const ingrediente = ingredientes.find((i) => i.id === id);
    const stockActual = ingrediente.attributes.stock_actual || 0;
    const nuevoStock = stockActual + cantidad;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { stock_actual: nuevoStock } }),
    });

    setCantidadAgregar((prev) => ({ ...prev, [id]: "" }));
    cargarIngredientes();
  };

  const crearIngrediente = async () => {
    const { nombre, unidad, stock_actual, stock_minimo } = nuevoIngrediente;
    if (!nombre || !unidad) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          nombre,
          unidad,
          stock_actual: parseFloat(stock_actual),
          stock_minimo: parseFloat(stock_minimo),
          publishedAt: new Date().toISOString()
        }
      }),
    });

    setNuevoIngrediente({ nombre: "", unidad: "", stock_actual: "", stock_minimo: "" });
    await cargarIngredientes();
  };

  useEffect(() => {
    cargarIngredientes();
  }, []);

  const ingredientesFiltrados = ingredientes.filter((i) =>
    i.attributes.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <h1 className="text-3xl font-bold mb-6">Inventario</h1>

        <input
          className="mb-6 max-w-sm border px-2 py-1 rounded"
          placeholder="Buscar ingrediente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="grid gap-4 mb-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {ingredientesFiltrados.map((ing) => (
            <Card
              key={ing.id}
              className={`p-4 border relative ${
                ing.attributes.stock_actual < ing.attributes.stock_minimo ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
              }`}
            >
              <h3 className="text-lg font-semibold mb-1">{ing.attributes.nombre}</h3>
              <p className="text-sm text-gray-700">Stock: {ing.attributes.stock_actual} {ing.attributes.unidad}</p>
              <p className="text-sm text-gray-500 mb-2">Mínimo: {ing.attributes.stock_minimo} {ing.attributes.unidad}</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  className="border px-2 py-1 rounded"
                  placeholder={`+ cantidad (${ing.attributes.unidad})`}
                  value={cantidadAgregar[ing.id] || ""}
                  onChange={(e) => setCantidadAgregar((prev) => ({ ...prev, [ing.id]: e.target.value }))}
                />
                <Button onClick={() => agregarStock(ing.id)}>Añadir</Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-white p-4 rounded shadow max-w-md">
          <h2 className="text-xl font-semibold mb-2">Añadir nuevo ingrediente</h2>
          <input className="mb-2 border px-2 py-1 rounded w-full" placeholder="Nombre" value={nuevoIngrediente.nombre} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, nombre: e.target.value })} />
          <input className="mb-2 border px-2 py-1 rounded w-full" placeholder="Unidad (g, ml, u)" value={nuevoIngrediente.unidad} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, unidad: e.target.value })} />
          <input className="mb-2 border px-2 py-1 rounded w-full" type="number" placeholder="Stock actual" value={nuevoIngrediente.stock_actual} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, stock_actual: e.target.value })} />
          <input className="mb-2 border px-2 py-1 rounded w-full" type="number" placeholder="Stock mínimo" value={nuevoIngrediente.stock_minimo} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, stock_minimo: e.target.value })} />
          <Button onClick={crearIngrediente}>Crear ingrediente</Button>
        </div>
      </div>
    </>
  );
}
