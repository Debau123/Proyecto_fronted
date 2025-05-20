"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [nuevoUsuario, setNuevoUsuario] = useState({ username: "", email: "", password: "" });

  const cargarUsuarios = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?pagination[pageSize]=100`);
    const data = await res.json();
    setUsuarios(data);
  };

  const crearUsuario = async () => {
    const { username, email, password } = nuevoUsuario;
    if (!username || !email || !password) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    setNuevoUsuario({ username: "", email: "", password: "" });
    await cargarUsuarios();
  };

  const eliminarUsuario = async (id) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, { method: "DELETE" });
    await cargarUsuarios();
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((u) =>
    u.username.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>

        <input
          className="mb-6 max-w-sm border px-2 py-1 rounded"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="grid gap-4 mb-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {usuariosFiltrados.map((u) => (
            <Card key={u.id} className="p-4 border border-gray-300 bg-white">
              <h3 className="text-lg font-semibold mb-1">{u.username}</h3>
              <p className="text-sm text-gray-700">Email: {u.email}</p>
              <div className="flex justify-end mt-2">
                <Button variant="destructive" onClick={() => eliminarUsuario(u.id)}>Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-white p-4 rounded shadow max-w-md">
          <h2 className="text-xl font-semibold mb-2">Crear nuevo usuario</h2>
          <input
            className="mb-2 border px-2 py-1 rounded w-full"
            placeholder="Nombre de usuario"
            value={nuevoUsuario.username}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })}
          />
          <input
            className="mb-2 border px-2 py-1 rounded w-full"
            placeholder="Email"
            value={nuevoUsuario.email}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
          />
          <input
            className="mb-2 border px-2 py-1 rounded w-full"
            type="password"
            placeholder="Contraseña"
            value={nuevoUsuario.password}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
          />
          <Button onClick={crearUsuario}>Crear usuario</Button>
        </div>
      </div>
    </>
  );
}
