"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ModalReceta from "@/components/ModalReceta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import moment from "moment";
import Link from "next/link";
import withCocineroOnly from "@/lib/withCocineroOnly";

function VistaCocinero() {
  const [pedidos, setPedidos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [ingredientesCriticos, setIngredientesCriticos] = useState([]);
  const [mostrarAlerta, setMostrarAlerta] = useState(true);

  const fetchPedidos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pedidos?populate[reserva][populate][cliente]=true&populate[pedido_productos][populate]=producto.receta.receta_ingredientes.ingrediente`);
      const data = await res.json();
      setPedidos(data.data);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    }
  };

  const fetchIngredientesCriticos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ingredientes?pagination[pageSize]=1000`);
      const data = await res.json();
      const criticos = data.data.filter(i => i.attributes.stock_actual <= i.attributes.stock_minimo);
      setIngredientesCriticos(criticos);
    } catch (error) {
      console.error("Error al cargar ingredientes críticos", error);
    }
  };

  useEffect(() => {
    fetchPedidos();
    fetchIngredientesCriticos();
    const interval = setInterval(() => {
      fetchPedidos();
      fetchIngredientesCriticos();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await fetch(`${API_URL}/api/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { estado: nuevoEstado } }),
      });
      fetchPedidos();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const tiempoDesdeCreacion = (fechaCreacion) => {
    return moment(fechaCreacion).fromNow();
  };

  const abrirModalReceta = (producto) => {
    setRecetaSeleccionada(producto?.attributes?.receta?.data);
    setModalOpen(true);
  };

  const renderPedidos = (lista, color) => (
    lista.length > 0 ? lista.map((pedido) => {
      const estado = pedido.attributes.estado;
      const cliente = pedido.attributes.reserva?.data?.attributes?.cliente?.data?.attributes?.username || "Sin cliente";
      const tiempo = tiempoDesdeCreacion(pedido.attributes.createdAt);
      const pedidoProductos = pedido.attributes.pedido_productos?.data || [];
      let siguienteEstado = null;
      if (estado === "pendiente") siguienteEstado = "en_proceso";
      else if (estado === "en_proceso") siguienteEstado = "preparado";

      return (
        <Card key={pedido.id} className={`border-l-4 ${color} shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-white/80 backdrop-blur rounded-lg w-full md:w-[48%]`}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pedido #{pedido.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Cliente:</strong> {cliente}</p>
            <p><strong>Tiempo transcurrido:</strong> {tiempo}</p>
            {pedidoProductos.length > 0 ? (
              <ul className="list-disc ml-4">
                {pedidoProductos.map((pp) => (
                  <li key={pp.id} className="text-sm">
                    <button
                      onClick={() => abrirModalReceta(pp.attributes.producto?.data)}
                      className="text-blue-600 hover:underline"
                    >
                      {pp.attributes.producto?.data?.attributes?.nombre || "Producto"}
                    </button> × {pp.attributes.cantidad || 1}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Sin productos asignados.</p>
            )}
            {siguienteEstado && (
              <Button className="mt-2" onClick={() => cambiarEstado(pedido.id, siguienteEstado)}>
                Cambiar a {siguienteEstado.replace("_", " ")}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }) : <p className="text-gray-500 text-sm">No hay pedidos en esta categoría.</p>
  );

  const pedidosPendientes = pedidos.filter(p => p.attributes.estado === "pendiente");
  const pedidosEnProceso = pedidos.filter(p => p.attributes.estado === "en_proceso");
  const pedidosPreparados = pedidos.filter(p => p.attributes.estado === "preparado");

  return (
    <div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-10 pt-20">
        <h1 className="text-3xl font-bold my-6 text-center">📦 Gestión de Pedidos en Cocina</h1>

        {mostrarAlerta && ingredientesCriticos.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 shadow-md">
            <strong className="font-bold">⚠ Ingredientes críticos: </strong>
            {ingredientesCriticos.map(i => i.attributes.nombre).join(", ")}
            <button
              onClick={() => setMostrarAlerta(false)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-yellow-600">🕒 Pendientes</h2>
          <div className="flex flex-wrap gap-4">
            {renderPedidos(pedidosPendientes, "border-yellow-500")}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">🔄 En Proceso</h2>
          <div className="flex flex-wrap gap-4">
            {renderPedidos(pedidosEnProceso, "border-blue-500")}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-600">✅ Preparados</h2>
          <div className="flex flex-wrap gap-4">
            {renderPedidos(pedidosPreparados, "border-green-500")}
          </div>
        </section>
      </div>

      <ModalReceta open={modalOpen} onClose={() => setModalOpen(false)} receta={recetaSeleccionada} />
    </div>
  );
}

export default withCocineroOnly(VistaCocinero);
