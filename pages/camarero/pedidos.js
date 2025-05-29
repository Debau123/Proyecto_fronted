"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import moment from "moment";
import { API_URL } from "@/lib/api";
import ModalCrearPedido from "@/components/ModalCrearPedido";
import { Button } from "@/components/ui/button";
import withCamareroOnly from "@/lib/withCamareroOnly"; // 🔒 Importa el HOC

function CamareroPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(moment().format("YYYY-MM-DD"));
  const [openModal, setOpenModal] = useState(false);

  const cargarPedidos = async () => {
    const inicio = moment().startOf("day").toISOString();
    const fin = moment().endOf("day").toISOString();
    const res = await fetch(`${API_URL}/api/pedidos?filters[fecha][$gte]=${inicio}&filters[fecha][$lte]=${fin}&populate[reserva][populate][cliente]=true&populate[pedido_productos][populate]=producto`);
    const data = await res.json();
    setPedidos(data.data);
  };

  const cargarHistorico = async () => {
    const inicio = moment(fechaSeleccionada).startOf("day").toISOString();
    const fin = moment(fechaSeleccionada).endOf("day").toISOString();
    const res = await fetch(`${API_URL}/api/pedidos?filters[fecha][$gte]=${inicio}&filters[fecha][$lte]=${fin}&populate[reserva][populate][cliente]=true&populate[pedido_productos][populate]=producto`);
    const data = await res.json();
    setHistorico(data.data);
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  useEffect(() => {
    cargarHistorico();
  }, [fechaSeleccionada]);

  const cambiarDia = (dias) => {
    const nuevaFecha = moment(fechaSeleccionada).add(dias, "days");
    if (nuevaFecha.isAfter(moment(), "day")) return;
    setFechaSeleccionada(nuevaFecha.format("YYYY-MM-DD"));
  };

  const estados = ["pendiente", "en_proceso", "completo"];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <h1 className="text-3xl font-bold mb-6">Pedidos - Camarero</h1>

        <Button className="mb-4" onClick={() => setOpenModal(true)}>➕ Crear Pedido</Button>
        <ModalCrearPedido open={openModal} onClose={() => { setOpenModal(false); cargarPedidos(); }} />

        <Tabs defaultValue="activos">
          <TabsList>
            <TabsTrigger value="activos">Pedidos activos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="activos">
            <div className="grid gap-6 mt-4">
              {estados.map((estado) => (
                <div key={estado}>
                  <h2 className="text-xl font-semibold capitalize mb-2">{estado}:</h2>
                  {pedidos.filter((p) => p.attributes.estado === estado).length === 0 ? (
                    <p className="text-sm text-gray-500">No hay pedidos en este estado.</p>
                  ) : (
                    <div className="grid gap-4">
                      {pedidos
                        .filter((p) => p.attributes.estado === estado)
                        .map((p) => {
                          const productos = p.attributes.pedido_productos?.data || [];
                          const cliente = p.attributes.reserva?.data?.attributes?.cliente?.data?.attributes?.username || "Anónimo";
                          const total = productos.reduce((sum, pp) => {
                            const precio = pp.attributes.producto?.data?.attributes?.precio || 0;
                            const cantidad = pp.attributes.cantidad || 0;
                            return sum + precio * cantidad;
                          }, 0);
                          return (
                            <Card key={p.id} className="p-4">
                              <p><strong>Cliente:</strong> {cliente}</p>
                              <p><strong>Fecha:</strong> {moment(p.attributes.fecha).format("DD/MM/YYYY HH:mm")}</p>
                              <ul className="list-disc pl-5">
                                {productos.map((pp) => (
                                  <li key={pp.id}>{pp.attributes.producto?.data?.attributes?.nombre || "Producto"} x{pp.attributes.cantidad}</li>
                                ))}
                              </ul>
                              <p className="mt-2"><strong>Total:</strong> {total.toFixed(2)} €</p>
                              <p><strong>Estado:</strong> {p.attributes.estado}</p>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <div className="mt-4">
              <div className="flex gap-2 items-center mb-4">
                <button onClick={() => cambiarDia(-1)}>&larr;</button>
                <input type="date" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)} className="border rounded px-2 py-1" />
                <button disabled={moment(fechaSeleccionada).isSame(moment(), "day")} onClick={() => cambiarDia(1)}>&rarr;</button>
              </div>

              <div className="grid gap-4">
                {historico.map((p) => {
                  const productos = p.attributes.pedido_productos?.data || [];
                  const cliente = p.attributes.reserva?.data?.attributes?.cliente?.data?.attributes?.username || "Anónimo";
                  const total = productos.reduce((sum, pp) => {
                    const precio = pp.attributes.producto?.data?.attributes?.precio || 0;
                    const cantidad = pp.attributes.cantidad || 0;
                    return sum + precio * cantidad;
                  }, 0);
                  return (
                    <Card key={p.id} className="p-4">
                      <p><strong>Cliente:</strong> {cliente}</p>
                      <p><strong>Fecha:</strong> {moment(p.attributes.fecha).format("DD/MM/YYYY HH:mm")}</p>
                      <ul className="list-disc pl-5">
                        {productos.map((pp) => (
                          <li key={pp.id}>{pp.attributes.producto?.data?.attributes?.nombre || "Producto"} x{pp.attributes.cantidad}</li>
                        ))}
                      </ul>
                      <p className="mt-2"><strong>Total:</strong> {total.toFixed(2)} €</p>
                      <p><strong>Estado:</strong> {p.attributes.estado}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default withCamareroOnly(CamareroPedidos); // 🔒 Protegemos la vista
