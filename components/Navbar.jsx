'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://restoratech-backend-production.up.railway.app";

export default function Navbar() {
  const [user, setUser] = useState(undefined); // undefined para diferenciar entre cargando y null
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setUser(null);

    fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setUser(data || null))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  // ⚠ Mientras carga el user, no mostrar nada
  if (user === undefined) return null;

  // ✅ NAVBAR ADMIN
  if (user?.rol === 'administrador') {
    return (
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-gray-800 font-semibold">
          <span className="text-xl font-bold">Restora<span className="text-green-600">Tech</span> Admin</span>
          <div className="flex gap-6 text-sm md:text-base">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <Link href="/admin/reservas" className="hover:underline">Reservas</Link>
            <Link href="/admin/carta" className="hover:underline">Carta</Link>
            <Link href="/admin/pedidos" className="hover:underline">Pedidos</Link>
            <Link href="/admin/inventario" className="hover:underline">Inventario</Link>
            <Link href="/admin/usuarios" className="hover:underline">Usuarios</Link>
            <button onClick={handleLogout} className="hover:underline">Logout</button>
          </div>
        </div>
      </nav>
    );
  }

  // ✅ NAVBAR CLIENTE O NO LOGUEADO
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-white font-semibold">
        <div className="flex-1 flex justify-center gap-8 text-sm md:text-base">
          <Link href="/" className="hover:underline">INICIO</Link>
          <Link href="/carta" className="hover:underline">CARTA</Link>
          {!user && <Link href="/login" className="hover:underline">LOGIN</Link>}
          {user?.rol === 'cliente' && (
            <button onClick={handleLogout} className="hover:underline">LOGOUT</button>
          )}
        </div>

        {user?.rol === 'cliente' && (
          <button
            onClick={() => router.push('/reservas')}
            className="bg-[#1c1f26] hover:bg-[#2a2d34] px-4 py-2 rounded text-sm shadow transition"
          >
            RESERVAR
          </button>
        )}
      </div>
    </nav>
  );
}
