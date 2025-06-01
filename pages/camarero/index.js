"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "react-hot-toast";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { API_URL } from "@/lib/api";
import { motion } from "framer-motion";
import withCamareroOnly from "@/lib/withCamareroOnly"; // Importa el HOC

function VistaCamarero() {
  const [mesas, setMesas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const prevMesasRef = useRef([]);

  useEffect(() => {
    fetchMesas();
    fetchReservas();
  }, []);

  const fetchMesas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/mesas?populate=reserva`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const mesasData = data.data.map((m) => ({
        id: m.id,
        nombre: m.attributes.numero,
        x: parseFloat(m.attributes.posicion_x) || 100,
        y: parseFloat(m.attributes.posicion_y) || 100,
        tipo: m.attributes.tipo || "cuadrada",
        capacidad: m.attributes.capacidad,
        reserva: m.attributes.reserva?.data,
        ocupada: !!m.attributes.reserva?.data,
      }));

      const prevMesas = prevMesasRef.current;
      const nuevasIncidencias = mesasData
        .filter((mesa) => {
          const prevMesa = prevMesas.find(p => p.id === mesa.id);
          return prevMesa && prevMesa.ocupada && !mesa.ocupada;
        })
        .map(mesa => ({
          id: mesa.id,
          descripcion: `🚨 Mesa ${mesa.nombre} ha quedado libre.`,
        }));

      setMesas(mesasData);
      setIncidencias(nuevasIncidencias);
      prevMesasRef.current = mesasData;
    } catch (err) {
      console.error("Error al cargar mesas:", err);
      toast.error("Error al cargar mesas");
    }
  };

  const fetchReservas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservas?populate=user`);
      const data = await res.json();
      const hoy = moment().format("YYYY-MM-DD");
      const reservasHoy = data.data.filter(r => r.attributes.fecha === hoy);
      setReservas(reservasHoy);
    } catch (err) {
      console.error("Error al cargar reservas:", err);
      toast.error("Error al cargar reservas");
    }
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
        <h1 className="text-2xl font-bold">📊 Dashboard Camarero</h1>

        <div className="bg-white shadow rounded-lg p-4 text-center text-lg font-semibold">
          Ocupación: {mesas.filter(m => m.ocupada).length}/{mesas.length} mesas ocupadas
        </div>

        <div className="flex justify-center">
          <div className="relative w-full max-w-4xl h-[600px] bg-gray-100 rounded-xl shadow-md border overflow-hidden">
            {mesas.map((mesa) => (
              <motion.div
                key={mesa.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className={`absolute flex flex-col items-center justify-center text-sm font-semibold text-white
                  ${mesa.tipo === "redonda" ? "rounded-full" : "rounded-md"}
                  ${mesa.ocupada ? "bg-red-600" : "bg-green-600"} shadow-lg`}
                style={{
                  left: mesa.x,
                  top: mesa.y,
                  width: "6rem",
                  height: "6rem",
                }}
              >
                <span>Mesa {mesa.nombre}</span>
                <span>{mesa.capacidad} pax</span>
                {mesa.ocupada && (
                  <>
                    <span className="text-xs">{mesa.reserva?.attributes?.hora}</span>
                    <span className="text-xs">{mesa.reserva?.attributes?.user?.data?.attributes?.username}</span>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">🕛 Turno Comida</h2>
            {reservasComida.length === 0 && <p className="text-gray-500">Sin reservas.</p>}
            {reservasComida.map((reserva) => (
              <Card key={reserva.id} className="p-4 mb-2">
                <p><strong>{reserva.attributes.user?.data?.attributes?.username || "Cliente"}</strong> - {reserva.attributes.hora}</p>
                <p>{reserva.attributes.comensales} comensales</p>
              </Card>
            ))}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">🌙 Turno Cena</h2>
            {reservasCena.length === 0 && <p className="text-gray-500">Sin reservas.</p>}
            {reservasCena.map((reserva) => (
              <Card key={reserva.id} className="p-4 mb-2">
                <p><strong>{reserva.attributes.user?.data?.attributes?.username || "Cliente"}</strong> - {reserva.attributes.hora}</p>
                <p>{reserva.attributes.comensales} comensales</p>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">🚨 Incidencias del día</h2>
          {incidencias.length === 0 ? (
            <p className="text-gray-500">No hay incidencias.</p>
          ) : (
            incidencias.map((inc) => (
              <Card key={inc.id} className="p-3 mb-2 bg-yellow-100">
                {inc.descripcion}
              </Card>
            ))
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-4 text-center text-lg font-semibold">
          Total reservas hoy: {reservas.length}
        </div>
      </div>
    </>
  );
}

export default withCamareroOnly(VistaCamarero); //  Protegemos la vista con el HOC
