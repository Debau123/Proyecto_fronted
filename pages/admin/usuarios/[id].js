"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import { API_URL } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import withAdminOnly from "@/lib/withAdminOnly";


function UsuarioDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [usuario, setUsuario] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [estadistica, setEstadistica] = useState([]);

  useEffect(() => {
    if (!id) return;

    // 1. Obtener usuario
    fetch(`${API_URL}/api/users/${id}`)
      .then((res) => res.json())
      .then(setUsuario);

    // 2. Obtener todas las reservas con cliente incluido
    fetch(`${API_URL}/api/reservas?populate=cliente&pagination[pageSize]=100`)
      .then((res) => res.json())
      .then((data) => {
        const todas = data?.data || [];

        // ✅ Filtrar solo las del cliente actual
        const propias = todas.filter(
          (r) => r.attributes.cliente?.data?.id === parseInt(id)
        );
        setReservas(propias);

        // 📊 Agrupar por mes
        const grouped = {};
        propias.forEach((r) => {
          const fecha = new Date(r.attributes.fecha);
          const key = fecha.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }); // Ej: "May 2025"
          grouped[key] = (grouped[key] || 0) + 1;
        });

        const estadisticaFinal = Object.entries(grouped)
          .map(([mes, visitas]) => ({ mes, visitas }))
          .sort((a, b) => new Date("1 " + a.mes) - new Date("1 " + b.mes));

        setEstadistica(estadisticaFinal);
      });

    // 3. Obtener pedidos
    fetch(`${API_URL}/api/pedidos?filters[cliente][id][$eq]=${id}&populate=platos`)
      .then((res) => res.json())
      .then((data) => setPedidos(data?.data || []));

    // 4. Obtener platos favoritos
    fetch(`${API_URL}/api/favoritos?user=${id}`)
      .then((res) => res.json())
      .then((data) => setFavoritos(data?.data || []));
  }, [id]);

  if (!usuario) return <div className="p-10">Cargando...</div>;

  return (
    <>
      <Navbar />
      <div className="pt-28 px-6 pb-20 bg-gray-100 min-h-screen space-y-10">
        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-3xl font-bold mb-2">{usuario.username}</h1>
          <p className="text-gray-700">Email: {usuario.email}</p>
          <p className="text-gray-700 mb-4">Rol: {usuario.rol}</p>
          <p className="italic text-gray-500">¡Hace mucho que no te vemos por aquí!</p>
        </div>

        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Reservas Antiguas</h2>
          {reservas.length === 0 ? (
            <p className="text-gray-500">No hay reservas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {reservas.map((r) => (
                <li key={r.id} className="border p-3 rounded">
                  <p className="text-sm text-gray-800">
                    Fecha: {new Date(r.attributes.fecha).toLocaleDateString()} —{" "}
                    Hora: {r.attributes.hora?.slice(0, 5)} — Comensales: {r.attributes.comensales}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Pedidos</h2>
          {pedidos.length === 0 ? (
            <p className="text-gray-500">No hay pedidos aún.</p>
          ) : (
            <ul className="space-y-2">
              {pedidos.map((p) => (
                <li key={p.id} className="border p-3 rounded">
                  <p className="text-sm text-gray-800">
                    Fecha: {new Date(p.attributes.fecha).toLocaleDateString()}
                  </p>
                  <ul className="ml-4 list-disc text-gray-600">
                    {p.attributes.platos?.map((plato, i) => (
                      <li key={i}>{plato.nombre}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Platos Favoritos</h2>
          {favoritos.length === 0 ? (
            <p className="text-gray-500">Sin favoritos aún.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {favoritos.map((f) => (
                <div key={f.id} className="p-4 border rounded bg-gray-50 shadow-sm">
                  <p className="font-semibold">{f.nombre}</p>
                  <p className="text-sm text-gray-500">Pedidos: {f.total}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Reservas por Mes</h2>
          {estadistica.length === 0 ? (
            <p className="text-gray-500">No hay datos suficientes aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={estadistica}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visitas" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}
export default withAdminOnly(UsuarioDetalle);
