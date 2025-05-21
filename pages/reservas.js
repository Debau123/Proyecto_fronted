'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../components/Navbar';
import { API_URL } from "@/lib/api";




export default function Reservas() {
  const router = useRouter();

  const [disponibilidades, setDisponibilidades] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horasGeneradas, setHorasGeneradas] = useState({ comida: [], cena: [] });
  const [aforoMaximo, setAforoMaximo] = useState({ comida: 0, cena: 0 });
  const [reservasDelDia, setReservasDelDia] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userNombre, setUserNombre] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [comensales, setComensales] = useState(1);
  const [mensaje, setMensaje] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [proximas, setProximas] = useState([]);
  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setUserId(data.id);
          setUserNombre(data.username);
        }
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/disponibilidades?filters[activo][$eq]=true`)
      .then(res => res.json())
      .then(data => setDisponibilidades(data.data || []));
  }, []);

  useEffect(() => {
    if (!fechaSeleccionada || disponibilidades.length === 0) return;

    const disponibles = disponibilidades.filter(
      d => d.attributes.fecha === fechaSeleccionada
    );

    if (disponibles.length === 0) {
      setHorasGeneradas({ comida: [], cena: [] });
      setAforoMaximo({ comida: 0, cena: 0 });
      return;
    }

    let comida = [];
    let cena = [];
    let aforoComida = 0;
    let aforoCena = 0;

    disponibles.forEach(d => {
      const [hInicio, mInicio] = d.attributes.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = d.attributes.hora_fin.split(':').map(Number);
      const turno = hInicio < 17 ? 'comida' : 'cena';
      if (turno === 'comida') aforoComida += d.attributes.aforo_maximo;
      else aforoCena += d.attributes.aforo_maximo;

      let current = new Date(`${fechaSeleccionada}T${String(hInicio).padStart(2, '0')}:${String(mInicio).padStart(2, '0')}`);
      const end = new Date(`${fechaSeleccionada}T${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`);

      while (current < end) {
        const hora = current.getHours();
        const formatted = `${String(hora).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
        if (hora < 17) {
          if (!comida.includes(formatted)) comida.push(formatted);
        } else {
          if (!cena.includes(formatted)) cena.push(formatted);
        }
        current.setMinutes(current.getMinutes() + 5);
      }
    });

    setHorasGeneradas({ comida, cena });
    setAforoMaximo({ comida: aforoComida, cena: aforoCena });

    fetch(`${API_URL}/api/reservas?filters[fecha][$eq]=${fechaSeleccionada}&populate=cliente`)
      .then(res => res.json())
      .then(data => setReservasDelDia(data.data || []));
  }, [fechaSeleccionada, disponibilidades]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/api/reservas?filters[cliente][id][$eq]=${userId}&sort=fecha:desc&sort=hora:desc&populate=cliente`)
      .then(res => res.json())
      .then(data => {
        const todas = data.data || [];
        setHistorial(todas.filter(r => r.attributes.fecha < hoy));
        setProximas(todas.filter(r => r.attributes.fecha >= hoy));
      });
  }, [userId, mensaje]);

  const formatearFecha = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatearHora = (hora) => hora.split(':').slice(0, 2).join(':');
  const getTurno = (hora) => (hora < '17:00' ? 'comida' : 'cena');

  const getComensalesTurno = (turno) =>
    reservasDelDia
      .filter(r => getTurno(formatearHora(r.attributes.hora)) === turno)
      .reduce((sum, r) => sum + r.attributes.comensales, 0);

  const handleReservar = async () => {
    if (!horaSeleccionada || !comensales || !userId) return;

    const turno = getTurno(horaSeleccionada);
    const totalTurno = getComensalesTurno(turno);

    if (totalTurno + comensales > aforoMaximo[turno]) {
      setMensaje(`No puedes reservar, se supera el aforo del turno ${turno}.`);
      return;
    }

    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          fecha: fechaSeleccionada,
          hora: `${horaSeleccionada}:00.000`,
          comensales,
          cliente: userId,
        },
      }),
    });

    const json = await res.json();
    if (json.data) {
      router.refresh();
    } else {
      setMensaje('Error al realizar la reserva.');
    }
  };

  const handleEliminar = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API_URL}/api/reservas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setMensaje('Reserva cancelada.');
      setReservasDelDia(prev => prev.filter(r => r.id !== id));
      setProximas(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="bg-cover bg-center min-h-screen" style={{ backgroundImage: 'url(/restaurant.jpg)' }}>
      <Navbar />
      <div className="backdrop-blur-sm bg-white/70 min-h-screen px-6 py-20">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">Reservas</h1>
        
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <label className="block mb-2 font-medium text-center">Selecciona una fecha:</label>
            <div className="flex justify-center">
              <DatePicker
                selected={fechaSeleccionada ? new Date(fechaSeleccionada) : null}
                onChange={(date) => {
                  const strFecha = formatearFecha(date);
                  setFechaSeleccionada(strFecha);
                  setHoraSeleccionada(null);
                  setMensaje(null);
                  setComensales(1);
                }}
                className="p-2 rounded border w-full max-w-xs text-center"
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                placeholderText="-- Elige una fecha --"
              />
            </div>
          </div>

          {['comida', 'cena'].map((turno) => (
            horasGeneradas[turno].length > 0 && (
              <div key={turno} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-center">Turno {turno}</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {horasGeneradas[turno].map((hora, i) => {
                    const bloqueadoPorAforo = getComensalesTurno(turno) >= aforoMaximo[turno];
                    const horaYaReservada = reservasDelDia.some(
                      r => formatearHora(r.attributes.hora) === hora
                    );
                    const deshabilitado = bloqueadoPorAforo || horaYaReservada;

                    return (
                      <button
                        key={i}
                        disabled={deshabilitado}
                        onClick={() => setHoraSeleccionada(hora)}
                        className={`w-full py-3 rounded-lg text-white text-center font-semibold transition shadow ${
                          horaSeleccionada === hora ? 'bg-blue-700' : ''
                        } ${
                          deshabilitado ? 'bg-red-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm text-center text-gray-700">
                  Aforo usado: {getComensalesTurno(turno)} / {aforoMaximo[turno]}
                </p>
              </div>
            )
          ))}

          {horaSeleccionada && (
            <div className="mt-8 bg-white rounded shadow p-4">
              <label className="block mb-2">¿Cuántos comensales?</label>
              <input
                type="number"
                min={1}
                max={10}
                value={comensales}
                onChange={(e) => setComensales(Number(e.target.value))}
                className="w-full p-2 border rounded mb-4"
              />
              <button
                onClick={handleReservar}
                className={`w-full font-bold py-2 rounded transition bg-blue-700 hover:bg-blue-800 text-white`}
              >
                Confirmar reserva a las {horaSeleccionada}
              </button>
              {mensaje && (
                <p className="text-sm text-red-700 text-center mt-2">
                  {mensaje}
                </p>
              )}
            </div>
          )}
        </div>

        {userId && (
          <div className="grid md:grid-cols-2 gap-10 mt-20">
            <div className="bg-white/90 rounded shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Reservas próximas</h3>
              {proximas.map((r, i) => (
                <div key={i} className="p-2 border-b text-sm">
                  <div><strong>Personas:</strong> {r.attributes.comensales}</div>
                  <div><strong>Reserva a nombre de:</strong> {userNombre}</div>
                  <div><strong>Fecha:</strong> {r.attributes.fecha}</div>
                  <div><strong>Hora:</strong> {formatearHora(r.attributes.hora)}</div>
                  <button
                    onClick={() => handleEliminar(r.id)}
                    className="mt-2 text-red-600 hover:underline text-xs"
                  >
                    Cancelar reserva
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-white/90 rounded shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Historial de reservas</h3>
              {historial.map((r, i) => (
                <div key={i} className="p-2 border-b text-sm">
                  <div><strong>Personas:</strong> {r.attributes.comensales}</div>
                  <div><strong>Reserva a nombre de:</strong> {userNombre}</div>
                  <div><strong>Fecha:</strong> {r.attributes.fecha}</div>
                  <div><strong>Hora:</strong> {formatearHora(r.attributes.hora)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
