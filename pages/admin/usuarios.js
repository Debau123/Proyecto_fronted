'use client';

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Toaster, toast } from "react-hot-toast";
import { API_URL } from "@/lib/api";
import Link from "next/link";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    username: "",
    email: "",
    password: "",
    rol: "cliente",
  });

  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users?pagination[pageSize]=100`);
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      toast.error("Error al cargar usuarios");
    }
  };

  const crearUsuario = async () => {
    const { username, email, password, rol } = nuevoUsuario;
    if (!username || !email || !password) return toast.error("Rellena todos los campos");

    try {
      // Llamada al endpoint personalizado que crea usuario con confirmed:true
      const res = await fetch(`${API_URL}/api/users/register-custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, rol }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return toast.error(errorData.message || "Error al crear usuario");
      }

      toast.success("Usuario creado y confirmado");
      setModalNuevo(false);
      setNuevoUsuario({ username: "", email: "", password: "", rol: "cliente" });
      await cargarUsuarios();
    } catch (error) {
      toast.error("Error al crear usuario");
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await fetch(`${API_URL}/api/users/${id}`, { method: "DELETE" });
      toast.success("Usuario eliminado");
      await cargarUsuarios();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const guardarEdicion = async () => {
    const { id, username, email, password, rol } = usuarioEditando;

    const bodyData = {
      username,
      email,
      rol,
      // No cambiamos confirmed para no resetear en edición
    };
    if (password && password.trim() !== "") {
      Object.assign(bodyData, { password });
    }

    try {
      await fetch(`${API_URL}/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      toast.success("Usuario actualizado");
      setModalEditar(false);
      setUsuarioEditando(null);
      await cargarUsuarios();
    } catch {
      toast.error("Error al editar usuario");
    }
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
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-100 px-6 pt-28 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <Button onClick={() => setModalNuevo(true)}>Crear nuevo usuario</Button>
        </div>

        <Input
          className="mb-6 max-w-sm"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="grid gap-4 mb-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {usuariosFiltrados.map((u) => (
            <Card key={u.id} className="p-4 border border-gray-300 bg-white">
              <Link href={`/admin/usuarios/${u.id}`}>
                <h3 className="text-lg font-semibold mb-1 text-blue-600 hover:underline cursor-pointer">
                  {u.username}
                </h3>
              </Link>
              <p className="text-sm text-gray-700">Email: {u.email}</p>
              <p className="text-sm text-gray-700 mb-2">Rol: {u.rol}</p>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => { setUsuarioEditando(u); setModalEditar(true); }}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => eliminarUsuario(u.id)}>
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Crear Usuario */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <Input className="mb-2" placeholder="Usuario" value={nuevoUsuario.username}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })}
          />
          <Input className="mb-2" placeholder="Email" value={nuevoUsuario.email}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
          />
          <Input className="mb-2" type="password" placeholder="Contraseña" value={nuevoUsuario.password}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
          />
          <Select value={nuevoUsuario.rol} onValueChange={(v) => setNuevoUsuario({ ...nuevoUsuario, rol: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="camarero">Camarero</SelectItem>
              <SelectItem value="cocinero">Cocinero</SelectItem>
              <SelectItem value="administrador">Administrador</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter className="pt-4">
            <Button onClick={crearUsuario}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Usuario */}
      {usuarioEditando && (
        <Dialog open={modalEditar} onOpenChange={setModalEditar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            <Input className="mb-2" placeholder="Usuario" value={usuarioEditando.username}
              onChange={(e) => setUsuarioEditando({ ...usuarioEditando, username: e.target.value })}
            />
            <Input className="mb-2" placeholder="Email" value={usuarioEditando.email}
              onChange={(e) => setUsuarioEditando({ ...usuarioEditando, email: e.target.value })}
            />
            <Input className="mb-2" type="password" placeholder="Contraseña nueva"
              onChange={(e) => setUsuarioEditando({ ...usuarioEditando, password: e.target.value })}
            />
            <Select value={usuarioEditando.rol} onValueChange={(v) => setUsuarioEditando({ ...usuarioEditando, rol: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="camarero">Camarero</SelectItem>
                <SelectItem value="cocinero">Cocinero</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter className="pt-4">
              <Button onClick={guardarEdicion}>Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
