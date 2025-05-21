"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Card, CardContent } from "../../components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { API_URL } from "@/lib/api";
import withAdminOnly from "@/lib/withAdminOnly"; 

const getResumenAdmin = async () => {
  const hoy = new Date().toISOString().split("T")[0];

  const [reservas, pedidos, ingredientes] = await Promise.all([
    fetch(`${API_URL}/api/reservas?filters[fecha][$eq]=${hoy}`).then(res => res.json()),
    fetch(`${API_URL}/api/pedidos?populate[pedido_productos][populate][producto]=true&pagination[limit]=100`).then(res => res.json()),
    fetch(`${API_URL}/api/ingredientes`).then(res => res.json()),
  ]);

  const ingresosHoy = pedidos.data.reduce((total, pedido) => {
    const fechaPedido = pedido.attributes.fecha?.split("T")[0];
    if (fechaPedido === hoy) {
      const lineas = pedido.attributes.pedido_productos?.data || [];
      const suma = lineas.reduce((acc, linea) => {
        const precio = linea.attributes.producto?.data?.attributes?.precio || 0;
        const cantidad = linea.attributes.cantidad || 0;
        return acc + (precio * cantidad);
      }, 0);
      return total + suma;
    }
    return total;
  }, 0);

  const ingredientesCriticos = ingredientes.data.filter(
    ing => ing.attributes.stock_actual < ing.attributes.stock_minimo
  ).length;

  return {
    reservasHoy: reservas.data.length,
    pedidosActivos: pedidos.data.filter(p => p.attributes.estado === "en_proceso").length,
    ingredientesCriticos,
    ingresosHoy,
  };
};

const getGraficoIngresosSemana = async () => {
  const res = await fetch(`${API_URL}/api/pedidos?populate[pedido_productos][populate][producto]=true&pagination[limit]=100`);
  const data = await res.json();
  const hoy = new Date();

  const dias = [...Array(7).keys()].map(i => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  const ingresosPorDia = dias.reverse().map(dia => {
    const total = data.data.reduce((acc, pedido) => {
      const fecha = pedido.attributes.fecha?.split("T")[0];
      if (fecha === dia) {
        const lineas = pedido.attributes.pedido_productos?.data || [];
        const suma = lineas.reduce((sum, linea) => {
          const precio = linea.attributes.producto?.data?.attributes?.precio || 0;
          const cantidad = linea.attributes.cantidad || 0;
          return sum + (precio * cantidad);
        }, 0);
        return acc + suma;
      }
      return acc;
    }, 0);
    return { fecha: dia, ingresos: total };
  });

  return ingresosPorDia;
};
function AdminDashboard() {
  const [resumen, setResumen] = useState({
    reservasHoy: 0,
    pedidosActivos: 0,
    ingresosHoy: 0,
    ingredientesCriticos: 0,
  });

  const [datosGraficoIngresos, setDatosGraficoIngresos] = useState([]);
  const [graficoReservaTurnos, setGraficoReservaTurnos] = useState([]);

  const COLORS = ["#60a5fa", "#facc15"];

  useEffect(() => {
    const fetchResumen = async () => {
      const datos = await getResumenAdmin();
      setResumen(datos);
    };

    const fetchGrafico = async () => {
      const datos = await getGraficoIngresosSemana();
      setDatosGraficoIngresos(datos);
    };

    const fetchReservasTurnos = async () => {
      const hoy = new Date().toISOString().split("T")[0];
      const res = await fetch(`${API_URL}/api/reservas?filters[fecha][$eq]=${hoy}`);
      const data = await res.json();

      let comida = 0;
      let cena = 0;

      data.data.forEach(reserva => {
        const hora = reserva.attributes.hora;
        const horaInt = parseInt(hora.split(":")[0]);

        if (horaInt < 17) {
          comida += 1;
        } else {
          cena += 1;
        }
      });

      setGraficoReservaTurnos([
        { name: "Comida", value: comida },
        { name: "Cena", value: cena },
      ]);
    };

    fetchResumen();
    fetchGrafico();
    fetchReservasTurnos();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-8">
        <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

        {resumen.ingredientesCriticos > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            ⚠️ Tienes {resumen.ingredientesCriticos} ingredientes por debajo del stock mínimo.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-md">
            <CardContent>
              <p className="text-sm text-gray-500">Reservas Hoy</p>
              <p className="text-2xl font-bold">{resumen.reservasHoy}</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent>
              <p className="text-sm text-gray-500">Pedidos Activos</p>
              <p className="text-2xl font-bold">{resumen.pedidosActivos}</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent>
              <p className="text-sm text-gray-500">Ingresos Hoy</p>
              <p className="text-2xl font-bold">{resumen.ingresosHoy.toFixed(2)} €</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardContent>
              <p className="text-sm text-gray-500">Ingredientes Críticos</p>
              <p className="text-2xl font-bold text-red-500">{resumen.ingredientesCriticos}</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Distribución de Reservas (hoy)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graficoReservaTurnos}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {graficoReservaTurnos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ingresos últimos 7 días</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGraficoIngresos}>
                <defs>
                  <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="fecha" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIngreso)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
export default withAdminOnly(AdminDashboard); // ✅ ENVUELTO EN EL WRAPPER
