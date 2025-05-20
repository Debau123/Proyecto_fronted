"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import moment from "moment";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(moment().format("YYYY-MM-DD"));
  const [ingresosDia, setIngresosDia] = useState(0);
  const [ingresosMes, setIngresosMes] = useState(0);
  const [datosGrafico, setDatosGrafico] = useState([]);

  const cargarPedidos = async () => {
    const inicio = moment().startOf("day").toISOString();
    const fin = moment().endOf("day").toISOString();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pedidos?filters[fecha][$gte]=${inicio}&filters[fecha][$lte]=${fin}&populate[reserva][populate][cliente]=true&populate[pedido_productos][populate]=producto`);
    const data = await res.json();
    setPedidos(data.data);
  };

  const cargarHistorico = async () => {
    const inicio = moment(fechaSeleccionada).startOf("day").toISOString();
    const fin = moment(fechaSeleccionada).endOf("day").toISOString();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pedidos?filters[fecha][$gte]=${inicio}&filters[fecha][$lte]=${fin}&populate[reserva][populate][cliente]=true&populate[pedido_productos][populate]=producto`);
    const data = await res.json();
    setHistorico(data.data);

    const totalDia = data.data.reduce((sum, p) => {
      const productos = p.attributes.pedido_productos?.data || [];
      return sum + productos.reduce((sub, pp) => {
        const precio = pp.attributes.producto?.data?.attributes?.precio || 0;
        const cantidad = pp.attributes.cantidad || 0;
        return sub + precio * cantidad;
      }, 0);
    }, 0);
    setIngresosDia(totalDia);
  };

  const cargarIngresosMes = async () => {
    const primerDia = moment().startOf("month").format("YYYY-MM-DD");
    const ultimoDia = moment().endOf("month").format("YYYY-MM-DD");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pedidos?filters[fecha][$gte]=${primerDia}&filters[fecha][$lte]=${ultimoDia}&populate[pedido_productos][populate]=producto&pagination[pageSize]=100`);
    const data = await res.json();
    const total = data.data.reduce((sum, p) => {
      const productos = p.attributes.pedido_productos?.data || [];
      return sum + productos.reduce((sub, pp) => {
        const precio = pp.attributes.producto?.data?.attributes?.precio || 0;
        const cantidad = pp.attributes.cantidad || 0;
        return sub + precio * cantidad;
      }, 0);
    }, 0);
    setIngresosMes(total);

    const ingresosPorDia = {};
    data.data.forEach((pedido) => {
      const fecha = pedido.attributes.fecha;
      const productos = pedido.attributes.pedido_productos?.data || [];
      const totalPedido = productos.reduce((sum, pp) => {
        const precio = pp.attributes.producto?.data?.attributes?.precio || 0;
        const cantidad = pp.attributes.cantidad || 0;
        return sum + precio * cantidad;
      }, 0);
      ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + totalPedido;
    });
    const datos = Object.entries(ingresosPorDia).map(([fecha, total]) => ({ fecha, total }));
    datos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    setDatosGrafico(datos);
  };

  useEffect(() => {
    cargarPedidos();
    cargarIngresosMes();
  }, []);

  useEffect(() => {
    cargarHistorico();
  }, [fechaSeleccionada]);

  const cambiarDia = (dias) => {
    const nuevaFecha = moment(fechaSeleccionada).add(dias, "days");
    if (nuevaFecha.isAfter(moment(), "day")) return;
    setFechaSeleccionada(nuevaFecha.format("YYYY-MM-DD"));
  };

  const estados = ["pendiente", "en_proceso", "completo", "cancelado"];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <h1 className="text-3xl font-bold mb-6">Gestión de Pedidos</h1>
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
                              <p><strong>Productos:</strong></p>
                              <ul className="list-disc pl-5">
                                {productos.map((pp) => (
                                  <li key={pp.id}>{pp.attributes.producto?.data?.attributes?.nombre || "Producto"} x{pp.attributes.cantidad}</li>
                                ))}
                              </ul>
                              <p className="mt-2"><strong>Total:</strong> {total.toFixed(2)} €</p>
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
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 items-center">
                  <Button onClick={() => cambiarDia(-1)}>&larr;</Button>
                  <input type="date" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)} className="border rounded px-2 py-1" />
                  <Button disabled={moment(fechaSeleccionada).isSame(moment(), "day")} onClick={() => cambiarDia(1)}>&rarr;</Button>
                </div>
                <div>
                  <p><strong>Ingresos del día:</strong> {ingresosDia.toFixed(2)} €</p>
                  <p><strong>Ingresos del mes:</strong> {ingresosMes.toFixed(2)} €</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-semibold mb-2">Ingresos del mes</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={datosGrafico} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="fecha" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => `${value} €`} />
                    <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#93c5fd" />
                  </AreaChart>
                </ResponsiveContainer>
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
