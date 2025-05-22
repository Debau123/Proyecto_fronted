"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "react-hot-toast";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const INICIAL_MESAS = [
  { id: 1, nombre: "M1", x: 60, y: 60, tipo: "cuadrada", capacidad: 2 },
  { id: 2, nombre: "M2", x: 150, y: 60, tipo: "cuadrada", capacidad: 2 },
  { id: 3, nombre: "M3", x: 240, y: 60, tipo: "cuadrada", capacidad: 2 },
  { id: 4, nombre: "M4", x: 330, y: 60, tipo: "cuadrada", capacidad: 2 },
  { id: 5, nombre: "M5", x: 60, y: 180, tipo: "cuadrada", capacidad: 4 },
  { id: 6, nombre: "M6", x: 180, y: 180, tipo: "cuadrada", capacidad: 4 },
  { id: 7, nombre: "M7", x: 60, y: 300, tipo: "cuadrada", capacidad: 6 },
  { id: 8, nombre: "M8", x: 200, y: 300, tipo: "cuadrada", capacidad: 6 },
  { id: 9, nombre: "M9", x: 340, y: 300, tipo: "cuadrada", capacidad: 6 },
  { id: 10, nombre: "M10", x: 150, y: 420, tipo: "redonda", capacidad: 8 },
  { id: 11, nombre: "M11", x: 300, y: 420, tipo: "redonda", capacidad: 8 },
];

export default function VistaCamarero() {
  const [mesas, setMesas] = useState(INICIAL_MESAS.map(m => ({ ...m, ocupada: false, reserva: null, x: m.x, y: m.y })));
  const [posiciones, setPosiciones] = useState({});
  const [reservas, setReservas] = useState([]);

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservas`);
      const data = await res.json();
      const hoy = moment().format("YYYY-MM-DD");
      const reservasHoy = data.data.filter(r => r.attributes.fecha === hoy);
      setReservas(reservasHoy);
    } catch (err) {
      toast.error("Error al cargar reservas");
    }
  };

  const asignarReserva = (mesaId, reserva) => {
    setMesas((prev) =>
      prev.map((mesa) =>
        mesa.id === mesaId
          ? { ...mesa, ocupada: true, reserva, capacidadAsignada: reserva.attributes.comensales }
          : mesa
      )
    );
    toast.success(`Reserva asignada a ${mesaId}`);
  };

  const quitarReserva = (mesaId) => {
    setMesas((prev) =>
      prev.map((mesa) =>
        mesa.id === mesaId ? { ...mesa, ocupada: false, reserva: null, capacidadAsignada: 0 } : mesa
      )
    );
    toast.success(`Reserva quitada de ${mesaId}`);
  };

  const handleDragEnd = (e, info, mesaId) => {
    setPosiciones((prev) => ({ ...prev, [mesaId]: { x: info.point.x, y: info.point.y } }));
  };

  const reservasComida = reservas.filter(r =>
    moment(r.attributes.hora, "HH:mm").isBefore(moment("17:00", "HH:mm"))
  );
  const reservasCena = reservas.filter(r =>
    moment(r.attributes.hora, "HH:mm").isSameOrAfter(moment("17:00", "HH:mm"))
  );

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Plano del restaurante</h1>

        {/* 🔲 Plano con agrupación visual */}
        <div className="relative w-full h-[700px] bg-gray-100 rounded-xl shadow-md border overflow-hidden">
          {mesas.map((mesa) => {
            const pos = posiciones[mesa.id] || { x: mesa.x, y: mesa.y };

            // Detectar agrupación
            const agrupadas = mesas.filter((otra) => {
              if (otra.id === mesa.id) return false;
              const posOtra = posiciones[otra.id] || { x: otra.x, y: otra.y };
              const distancia = Math.sqrt(
                Math.pow(pos.x - posOtra.x, 2) + Math.pow(pos.y - posOtra.y, 2)
              );
              return distancia < 80;
            });

            const grupoCompleto = [mesa, ...agrupadas];
            const capacidadTotal = grupoCompleto.reduce((acc, m) => acc + m.capacidad, 0);
            const nombres = grupoCompleto.map((m) => m.nombre).join(" + ");
            const estaAgrupada = agrupadas.length > 0;

            return (
              <motion.div
                key={mesa.id}
                drag
                dragMomentum={false}
                onDragEnd={(e, info) => handleDragEnd(e, info, mesa.id)}
                className={`
                  absolute flex flex-col items-center justify-center text-sm font-semibold text-white cursor-move
                  transition-all duration-300 ease-in-out
                  ${mesa.tipo === "redonda" ? "rounded-full" : "rounded-md"}
                  ${mesa.ocupada ? "bg-red-600" : estaAgrupada ? "bg-blue-500" : "bg-green-600"}
                  shadow-lg
                `}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: estaAgrupada ? "7rem" : "6rem",
                  height: estaAgrupada ? "7rem" : "6rem",
                  zIndex: estaAgrupada ? 10 : 1,
                  border: estaAgrupada ? "3px dashed #fff" : "none",
                  position: "absolute",
                }}
              >
                <span className="text-center leading-tight text-xs px-1">{nombres}</span>
                <span className="text-center">{capacidadTotal} pax</span>
                {mesa.ocupada && (
                  <button
                    onClick={() => quitarReserva(mesa.id)}
                    className="text-xs underline mt-1"
                  >
                    Quitar
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="bg-white shadow rounded-lg p-4 text-center text-lg font-semibold">
          Total reservas hoy: {reservas.length}
        </div>

        {/* Reservas por turno */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">🕛 Turno Comida</h2>
            {reservasComida.length === 0 && <p className="text-gray-500">Sin reservas.</p>}
            {reservasComida.map((reserva) => (
              <Card key={reserva.id} className="p-4 mb-2">
                <p><strong>{reserva.attributes.nombre_cliente}</strong> - {reserva.attributes.hora}</p>
                <p>{reserva.attributes.comensales} comensales</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mesas
                    .filter((m) => !m.ocupada)
                    .map((mesa) => {
                      const pos = posiciones[mesa.id] || { x: mesa.x, y: mesa.y };
                      const agrupadas = mesas.filter((otra) => {
                        if (otra.id === mesa.id) return false;
                        const posOtra = posiciones[otra.id] || { x: otra.x, y: otra.y };
                        const distancia = Math.sqrt(
                          Math.pow(pos.x - posOtra.x, 2) + Math.pow(pos.y - posOtra.y, 2)
                        );
                        return distancia < 80;
                      });
                      const total = [mesa, ...agrupadas].reduce((sum, m) => sum + m.capacidad, 0);
                      return total >= reserva.attributes.comensales ? (
                        <Button key={mesa.id} onClick={() => asignarReserva(mesa.id, reserva)} className="text-xs">
                          Asignar a {mesa.nombre}
                        </Button>
                      ) : null;
                    })}
                </div>
              </Card>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">🌙 Turno Cena</h2>
            {reservasCena.length === 0 && <p className="text-gray-500">Sin reservas.</p>}
            {reservasCena.map((reserva) => (
              <Card key={reserva.id} className="p-4 mb-2">
                <p><strong>{reserva.attributes.nombre_cliente}</strong> - {reserva.attributes.hora}</p>
                <p>{reserva.attributes.comensales} comensales</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mesas
                    .filter((m) => !m.ocupada)
                    .map((mesa) => {
                      const pos = posiciones[mesa.id] || { x: mesa.x, y: mesa.y };
                      const agrupadas = mesas.filter((otra) => {
                        if (otra.id === mesa.id) return false;
                        const posOtra = posiciones[otra.id] || { x: otra.x, y: otra.y };
                        const distancia = Math.sqrt(
                          Math.pow(pos.x - posOtra.x, 2) + Math.pow(pos.y - posOtra.y, 2)
                        );
                        return distancia < 80;
                      });
                      const total = [mesa, ...agrupadas].reduce((sum, m) => sum + m.capacidad, 0);
                      return total >= reserva.attributes.comensales ? (
                        <Button key={mesa.id} onClick={() => asignarReserva(mesa.id, reserva)} className="text-xs">
                          Asignar a {mesa.nombre}
                        </Button>
                      ) : null;
                    })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
