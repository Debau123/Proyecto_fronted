"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { TrashIcon } from "lucide-react";
import moment from "moment";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { API_URL } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

export default function AdminReservas() {
  const [reservasHoy, setReservasHoy] = useState([]);
  const [reservasFuturas, setReservasFuturas] = useState([]);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [semanaActual, setSemanaActual] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalReservaAbierto, setModalReservaAbierto] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [isLoadingReservas, setIsLoadingReservas] = useState(false);
  const [isLoadingDisponibilidad, setIsLoadingDisponibilidad] = useState(false);

  const [nuevaDisponibilidad, setNuevaDisponibilidad] = useState({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    aforo_maximo: "",
  });

  const [reserva, setReserva] = useState({
    fecha: "",
    hora: "",
    comensales: 1,
  });

  const [horasTurno, setHorasTurno] = useState({ comida: [], cena: [] });
  const [aforoTurno, setAforoTurno] = useState({ comida: 0, cena: 0 });
  const [reservasDelDia, setReservasDelDia] = useState([]);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users?pagination[limit]=100`);
      const data = await res.json();
      setUsuarios(data);
    } catch {
      toast.error("Error al cargar usuarios");
    }
  };

  const fetchReservas = async () => {
    try {
      setIsLoadingReservas(true);
      const hoy = new Date().toISOString().split("T")[0];
      const res = await fetch(`${API_URL}/api/reservas?populate=cliente&pagination[limit]=100`);
      const data = await res.json();
      const hoyList = [];
      const futuras = [];
      data.data.forEach((r) => {
        const fecha = r.attributes.fecha;
        if (fecha === hoy) {
          hoyList.push(r);
        } else if (fecha > hoy) {
          futuras.push(r);
        }
      });
      setReservasHoy(hoyList);
      setReservasFuturas(futuras);
    } catch {
      toast.error("Error al cargar reservas");
    } finally {
      setIsLoadingReservas(false);
    }
  };

  const fetchDisponibilidades = async () => {
    try {
      setIsLoadingDisponibilidad(true);
      const res = await fetch(`${API_URL}/api/disponibilidades?pagination[limit]=100`);
      const data = await res.json();
      setDisponibilidades(data.data);
    } catch {
      toast.error("Error al cargar disponibilidades");
    } finally {
      setIsLoadingDisponibilidad(false);
    }
  };

  const cancelarReserva = async (id) => {
    toast.promise(
      fetch(`${API_URL}/api/reservas/${id}`, {
        method: "DELETE",
      }),
      {
        loading: "Cancelando reserva...",
        success: "Reserva cancelada",
        error: "Error al cancelar reserva",
      }
    ).then(fetchReservas);
  };

  const eliminarDisponibilidad = async (id) => {
    toast.promise(
      fetch(`${API_URL}/api/disponibilidades/${id}`, {
        method: "DELETE",
      }),
      {
        loading: "Eliminando disponibilidad...",
        success: "Disponibilidad eliminada",
        error: "Error al eliminar disponibilidad",
      }
    ).then(fetchDisponibilidades);
  };

  const crearReserva = async () => {
    const { fecha, hora, comensales } = reserva;
    const hoy = new Date().toISOString().split("T")[0];
    if (fecha < hoy) {
      setError("No se puede reservar en días pasados.");
      return;
    }

    if (!fecha || !hora || !comensales || !usuarioSeleccionado) {
      setError("Todos los campos son obligatorios, incluyendo el cliente.");
      return;
    }

    const turno = getTurno(hora);
    const totalTurno = getComensalesTurno(turno);
    if (totalTurno + comensales > aforoTurno[turno]) {
      setError("Se supera el aforo máximo para este turno.");
      return;
    }

    toast.promise(
      fetch(`${API_URL}/api/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            fecha,
            hora: convertirHora(hora),
            comensales: parseInt(comensales),
            cliente: parseInt(usuarioSeleccionado),
            publishedAt: new Date().toISOString(),
          },
        }),
      }),
      {
        loading: "Guardando reserva...",
        success: "Reserva creada",
        error: "Error al crear reserva",
      }
    ).then(() => {
      setReserva({ fecha: "", hora: "", comensales: 1 });
      setUsuarioSeleccionado("");
      setModalReservaAbierto(false);
      fetchReservas();
    });
  };

  const getTurno = (hora) => (hora < "17:00" ? "comida" : "cena");

  const getComensalesTurno = (turno) =>
    reservasDelDia
      .filter((r) => getTurno(r.attributes.hora.slice(0, 5)) === turno)
      .reduce((sum, r) => sum + r.attributes.comensales, 0);

  useEffect(() => {
    fetchReservas();
    fetchDisponibilidades();
    fetchUsuarios();
  }, []);

  useEffect(() => {
    if (!reserva.fecha) return;

    const disponibles = disponibilidades.filter(
      (d) => d.attributes.fecha === reserva.fecha
    );

    const comida = [];
    const cena = [];
    let aforoComida = 0;
    let aforoCena = 0;

    disponibles.forEach((d) => {
      const [hInicio, mInicio] = d.attributes.hora_inicio.split(":" ).map(Number);
      const [hFin, mFin] = d.attributes.hora_fin.split(":" ).map(Number);
      const turno = hInicio < 17 ? "comida" : "cena";
      if (turno === "comida") aforoComida += d.attributes.aforo_maximo;
      else aforoCena += d.attributes.aforo_maximo;

      let current = new Date(`${reserva.fecha}T${String(hInicio).padStart(2, "0")}:${String(mInicio).padStart(2, "0")}`);
      const end = new Date(`${reserva.fecha}T${String(hFin).padStart(2, "0")}:${String(mFin).padStart(2, "0")}`);

      while (current < end) {
        const hora = current.getHours();
        const formatted = `${String(hora).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`;
        if (hora < 17) {
          if (!comida.includes(formatted)) comida.push(formatted);
        } else {
          if (!cena.includes(formatted)) cena.push(formatted);
        }
        current.setMinutes(current.getMinutes() + 5);
      }
    });

    setHorasTurno({ comida, cena });
    setAforoTurno({ comida: aforoComida, cena: aforoCena });

    fetch(`${API_URL}/api/reservas?filters[fecha][$eq]=${reserva.fecha}&populate=cliente`)
      .then((res) => res.json())
      .then((data) => setReservasDelDia(data.data || []));
  }, [reserva.fecha]);

  const convertirHora = (hora) => (hora.length === 5 ? `${hora}:00.000` : `${hora}.000`);

  const getSemanaVisible = () => {
    const startOfWeek = moment().add(semanaActual, "weeks").startOf("isoWeek");
    const endOfWeek = moment().add(semanaActual, "weeks").endOf("isoWeek");

    return disponibilidades
      .filter((d) => {
        const fecha = moment(d.attributes.fecha);
        return fecha.isBetween(startOfWeek, endOfWeek, null, "[]");
      })
      .sort((a, b) => {
        const fechaA = `${a.attributes.fecha}T${a.attributes.hora_inicio}`;
        const fechaB = `${b.attributes.fecha}T${b.attributes.hora_inicio}`;
        return new Date(fechaA) - new Date(fechaB);
      });
  };
  return (
  <>
    <Navbar />
    <Toaster position="top-right" />
    <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Reservas</h1>

      <Tabs defaultValue="reservas">
        <TabsList>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="disponibilidad">Disponibilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="reservas">
          {isLoadingReservas ? (
            <p className="text-gray-500">Cargando reservas...</p>
          ) : (
            <>
              <div className="flex justify-end mt-4">
                <Dialog open={modalReservaAbierto} onOpenChange={setModalReservaAbierto}>
                  <DialogTrigger asChild>
                    <Button>Añadir Reserva</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nueva Reserva</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <select
                        value={usuarioSeleccionado}
                        onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Selecciona un cliente</option>
                        {usuarios.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                      <select
                        value={reserva.fecha}
                        onChange={(e) => setReserva({ ...reserva, fecha: e.target.value, hora: "" })}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Selecciona una fecha</option>
                        {[...new Set(disponibilidades.map(d => d.attributes.fecha))].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>

                      {["comida", "cena"].map((turno) =>
                        horasTurno[turno].length > 0 && (
                          <div key={turno}>
                            <p className="font-semibold mt-2">Turno {turno}</p>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {horasTurno[turno].map((h, i) => {
                                const horaYaReservada = reservasDelDia.some(
                                  r => r.attributes.hora.slice(0, 5) === h
                                );
                                const bloqueado = getComensalesTurno(turno) >= aforoTurno[turno];
                                const deshabilitado = bloqueado || horaYaReservada;

                                return (
                                  <button
                                    key={i}
                                    disabled={deshabilitado}
                                    onClick={() => setReserva({ ...reserva, hora: h })}
                                    className={`text-sm py-2 rounded ${
                                      reserva.hora === h ? "bg-blue-700 text-white" :
                                      deshabilitado ? "bg-red-300 text-white cursor-not-allowed" :
                                      "bg-green-500 text-white hover:bg-green-600"
                                    }`}
                                  >
                                    {h}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}

                      <input
                        type="number"
                        placeholder="Comensales"
                        min={1}
                        value={reserva.comensales}
                        onChange={(e) => setReserva({ ...reserva, comensales: parseInt(e.target.value) })}
                        className="border rounded px-2 py-1"
                      />
                      {error && <p className="text-red-600 text-sm">{error}</p>}
                    </div>
                    <DialogFooter>
                      <Button onClick={crearReserva}>Guardar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <h2 className="text-xl font-semibold mt-4 mb-2">Reservas de Hoy</h2>
              {reservasHoy.map((r) => (
                <Card key={r.id} className="p-4 mb-2 flex justify-between items-center">
                  <div>
                    <p><strong>Cliente:</strong> {r.attributes.cliente?.data?.attributes?.username || "Sin cliente"}</p>
                    <p><strong>Hora:</strong> {r.attributes.hora}</p>
                  </div>
                  <Button variant="destructive" onClick={() => cancelarReserva(r.id)}>
                    <TrashIcon className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                </Card>
              ))}

              <h2 className="text-xl font-semibold mt-6 mb-2">Próximas Reservas</h2>
              {reservasFuturas.map((r) => (
                <Card key={r.id} className="p-4 mb-2 flex justify-between items-center">
                  <div>
                    <p><strong>Cliente:</strong> {r.attributes.cliente?.data?.attributes?.username || "Sin cliente"}</p>
                    <p><strong>Fecha:</strong> {r.attributes.fecha}</p>
                    <p><strong>Hora:</strong> {r.attributes.hora}</p>
                  </div>
                  <Button variant="destructive" onClick={() => cancelarReserva(r.id)}>
                    <TrashIcon className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="disponibilidad">
          <div className="flex justify-between items-center mt-4 mb-4">
            <h2 className="text-xl font-semibold">
              Días Disponibles (Semana {semanaActual >= 0 ? "+" + semanaActual : semanaActual})
            </h2>
            <div className="flex gap-2">
              <Button onClick={() => setSemanaActual(semanaActual - 1)}>Semana anterior</Button>
              <Button onClick={() => setSemanaActual(semanaActual + 1)}>Semana siguiente</Button>
              <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                <DialogTrigger asChild>
                  <Button>Añadir Disponibilidad</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Disponibilidad</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <input
                      type="date"
                      value={nuevaDisponibilidad.fecha}
                      onChange={(e) =>
                        setNuevaDisponibilidad({ ...nuevaDisponibilidad, fecha: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="time"
                      value={nuevaDisponibilidad.hora_inicio}
                      onChange={(e) =>
                        setNuevaDisponibilidad({ ...nuevaDisponibilidad, hora_inicio: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="time"
                      value={nuevaDisponibilidad.hora_fin}
                      onChange={(e) =>
                        setNuevaDisponibilidad({ ...nuevaDisponibilidad, hora_fin: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="number"
                      placeholder="Aforo máximo"
                      value={nuevaDisponibilidad.aforo_maximo}
                      onChange={(e) =>
                        setNuevaDisponibilidad({ ...nuevaDisponibilidad, aforo_maximo: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    />
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => {
                      if (!nuevaDisponibilidad.fecha || !nuevaDisponibilidad.hora_inicio || !nuevaDisponibilidad.hora_fin || !nuevaDisponibilidad.aforo_maximo) {
                        setError("Todos los campos son obligatorios.");
                        return;
                      }
                      toast.promise(
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/disponibilidades`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            data: {
                              fecha: nuevaDisponibilidad.fecha,
                              hora_inicio: convertirHora(nuevaDisponibilidad.hora_inicio),
                              hora_fin: convertirHora(nuevaDisponibilidad.hora_fin),
                              aforo_maximo: parseInt(nuevaDisponibilidad.aforo_maximo),
                              activo: true,
                              publishedAt: new Date().toISOString(),
                            },
                          }),
                        }),
                        {
                          loading: "Guardando disponibilidad...",
                          success: "Disponibilidad guardada",
                          error: "Error al guardar disponibilidad",
                        }
                      ).then(() => {
                        setNuevaDisponibilidad({ fecha: "", hora_inicio: "", hora_fin: "", aforo_maximo: "" });
                        setModalAbierto(false);
                        fetchDisponibilidades();
                      });
                    }}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {getSemanaVisible().length === 0 && (
            <p className="text-gray-500">No hay disponibilidades para esta semana.</p>
          )}
          {getSemanaVisible().map((d) => (
            <Card key={d.id} className="p-4 mb-2 flex justify-between items-center">
              <div>
                <p><strong>Fecha:</strong> {d.attributes.fecha}</p>
                <p><strong>Horario:</strong> {d.attributes.hora_inicio} - {d.attributes.hora_fin}</p>
                <p><strong>Aforo:</strong> {d.attributes.aforo_maximo}</p>
              </div>
              <Button variant="destructive" onClick={() => eliminarDisponibilidad(d.id)}>
                <TrashIcon className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  </>
);
}