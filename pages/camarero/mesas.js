import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import PlanoMesasCamarero from "@/components/camarero/PlanoMesasCamarero";
import { API_URL } from "@/lib/api";
import { toast } from "react-hot-toast"; // 🚩 Importa toast

export default function CamareroMesas() {
  const [reservas, setReservas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [turnoActual, setTurnoActual] = useState("mañana");

  const fetchReservas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservas?populate=cliente`);
      const data = await res.json();
      setReservas(data.data || []);
    } catch (err) {
      console.error("Error al cargar reservas:", err);
      toast.error("Error al cargar reservas");
    }
  };

  const fetchMesas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/mesas?populate=*`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMesas(data.data || []);
    } catch (err) {
      console.error("Error al cargar mesas:", err);
      toast.error("Error al cargar mesas");
    }
  };

  useEffect(() => {
    fetchReservas();
    fetchMesas();
  }, []);

  const hoy = new Date().toISOString().split("T")[0];
  const reservasHoy = reservas.filter((r) => r.attributes.fecha === hoy);
  const reservasTurno =
    turnoActual === "mañana"
      ? reservasHoy.filter((r) => r.attributes.hora < "17:00")
      : reservasHoy.filter((r) => r.attributes.hora >= "17:00");

  const totalComensales = reservasHoy.reduce(
    (total, r) => total + (r.attributes.comensales || 0),
    0
  );

  const handleAsignarMesa = async (reservaId, mesaId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/mesas/${mesaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { reserva: reservaId, reservada: true } }),
      });
      await fetchMesas(); // Recarga mesas
      toast.success("Mesa asignada correctamente");
    } catch (err) {
      console.error("Error al asignar mesa:", err);
      toast.error("Error al asignar mesa");
    }
  };

  const handleDesasignarMesa = async (mesaId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/mesas/${mesaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { reserva: null, reservada: false } }),
      });
      await fetchMesas(); // Recarga mesas
      toast.success("Mesa desasignada correctamente");
    } catch (err) {
      console.error("Error al desasignar mesa:", err);
      toast.error("Error al desasignar mesa");
    }
  };

  return (
    <div>
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Plano del Restaurante</h1>

        <div className="bg-gray-100 p-4 rounded shadow mb-8">
          <PlanoMesasCamarero mesas={mesas} reloadMesas={fetchMesas} />
        </div>

        <div className="mb-4">
          <label className="mr-2 font-semibold">Turno:</label>
          <select
            value={turnoActual}
            onChange={(e) => setTurnoActual(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="mañana">Comida (mañana)</option>
            <option value="tarde">Cena (tarde)</option>
          </select>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            Reservas del {turnoActual === "mañana" ? "turno mañana" : "turno tarde"}
          </h2>
          {reservasTurno.length === 0 ? (
            <p>No hay reservas para este turno.</p>
          ) : (
            reservasTurno.map((r) => {
              const mesaAsignada = mesas.find((m) => m.attributes.reserva?.data?.id === r.id);
              return (
                <div
                  key={r.id}
                  className="border p-4 rounded shadow mb-4 flex justify-between items-center"
                >
                  <span>
                    <strong>{r.attributes.cliente?.data?.attributes?.username || "Sin cliente"}</strong> -{" "}
                    {r.attributes.hora} - {r.attributes.comensales} pax
                  </span>
                  <div className="flex gap-2">
                    {mesaAsignada ? (
                      <button
                        onClick={() => handleDesasignarMesa(mesaAsignada.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Desasignar Mesa {mesaAsignada.attributes.numero}
                      </button>
                    ) : (
                      mesas
                        .filter((m) => !m.attributes.reservada)
                        .map((mesa) => (
                          <button
                            key={mesa.id}
                            onClick={() => handleAsignarMesa(r.id, mesa.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded"
                          >
                            Asignar Mesa {mesa.attributes.numero}
                          </button>
                        ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        <div className="bg-green-100 p-4 rounded shadow flex justify-center mt-6">
          <span className="text-lg font-semibold">
            Total comensales: {totalComensales}
          </span>
        </div>
      </main>
    </div>
  );
}
