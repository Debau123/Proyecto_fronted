import { useEffect, useState } from "react";
import io from "socket.io-client";
import Navbar from "@/components/Navbar";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import moment from "moment";
import ModalCrearPedido from "@/components/ModalCrearPedido";
import withCamareroOnly from "@/lib/withCamareroOnly";

const socket = io(API_URL);

function CamareroPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [fechaHistorico, setFechaHistorico] = useState(moment().subtract(1, "day").format("YYYY-MM-DD"));

  const cargarPedidos = async () => {
    const res = await fetch(`${API_URL}/api/pedidos?populate=pedido_productos.producto,reserva.user`);
    const data = await res.json();
    setPedidos(data.data);
  };

  useEffect(() => {
    cargarPedidos();
    socket.on("pedido_actualizado", (data) => {
      console.log("Pedido actualizado:", data);
      cargarPedidos();
    });

    const interval = setInterval(() => {
      cargarPedidos();
    }, 5000); // cada 5 segundos, igual que en cocina

    return () => {
      socket.off("pedido_actualizado");
      clearInterval(interval);
    };
  }, []);

  const avanzarEstado = async (pedido) => {
    const secuencia = ["pendiente", "en_proceso", "preparado", "completo"];
    const actual = pedido.attributes.estado;
    const siguiente = secuencia[secuencia.indexOf(actual) + 1] || actual;
    await fetch(`${API_URL}/api/pedidos/${pedido.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { estado: siguiente } }),
    });
    socket.emit("pedido_actualizado", { id: pedido.id, estado: siguiente });
    cargarPedidos();
  };

  const cancelarPedido = async (pedido) => {
    await fetch(`${API_URL}/api/pedidos/${pedido.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { estado: "cancelado" } }),
    });
    socket.emit("pedido_actualizado", { id: pedido.id, estado: "cancelado" });
    cargarPedidos();
  };

  const estados = ["pendiente", "en_proceso", "preparado", "completo", "cancelado"];

  const pedidosHoy = pedidos.filter((p) => moment(p.attributes.fecha).isSame(moment(), "day"));
  const pedidosHistoricos = pedidos.filter((p) => moment(p.attributes.fecha).isSame(fechaHistorico, "day"));
  const pedidosManana = pedidosHoy.filter((p) => moment(p.attributes.fecha).hour() < 17);
  const pedidosNoche = pedidosHoy.filter((p) => moment(p.attributes.fecha).hour() >= 17);

  const renderFlujo = (lista, turno) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{turno}</h2>
      {estados.map((estado) => (
        <div key={estado} className="mb-6">
          <h3 className="text-xl font-semibold capitalize mb-2">{estado}:</h3>
          {lista.filter((p) => p.attributes.estado === estado).length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos en este estado.</p>
          ) : (
            <div className="grid gap-4">
              {lista
                .filter((p) => p.attributes.estado === estado)
                .map((p) => {
                  const productos = p.attributes.pedido_productos?.data || [];
                  const cliente = p.attributes.reserva?.data?.attributes?.user?.data?.attributes?.username || "Anónimo";
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
                      <div className="flex gap-2 mt-2">
                        {p.attributes.estado !== "completo" && p.attributes.estado !== "cancelado" && (
                          <Button onClick={() => avanzarEstado(p)}>Avanzar estado</Button>
                        )}
                        {p.attributes.estado !== "cancelado" && (
                          <Button variant="destructive" onClick={() => cancelarPedido(p)}>Cancelar</Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderHistorico = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">Histórico - {moment(fechaHistorico).format("DD/MM/YYYY")}</h2>
      <div className="mb-4">
        <input
          type="date"
          value={fechaHistorico}
          onChange={(e) => setFechaHistorico(e.target.value)}
          max={moment().subtract(1, "day").format("YYYY-MM-DD")}
          className="border rounded px-3 py-1"
        />
      </div>
      {pedidosHistoricos.length === 0 ? (
        <p className="text-sm text-gray-500">No hay pedidos para esta fecha.</p>
      ) : (
        <div className="grid gap-4">
          {pedidosHistoricos.map((p) => {
            const productos = p.attributes.pedido_productos?.data || [];
            const cliente = p.attributes.reserva?.data?.attributes?.user?.data?.attributes?.username || "Anónimo";
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
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <h1 className="text-3xl font-bold mb-6">Pedidos - Camarero</h1>

        <Button className="mb-4" onClick={() => setOpenModal(true)}>➕ Crear Pedido</Button>
        <ModalCrearPedido open={openModal} onClose={() => { setOpenModal(false); cargarPedidos(); }} />

        <Tabs defaultValue="activos">
          <TabsList>
            <TabsTrigger value="activos">Pedidos Activos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="activos">
            {renderFlujo(pedidosManana, "Turno Mañana")}
            {moment().hour() >= 17 && renderFlujo(pedidosNoche, "Turno Noche")}
          </TabsContent>

          <TabsContent value="historico">
            {renderHistorico()}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default withCamareroOnly(CamareroPedidos);
