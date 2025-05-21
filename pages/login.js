'use client';

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [emailReset, setEmailReset] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/local`,
        {
          identifier: email,
          password,
        }
      );

      const { jwt, user } = res.data;
      localStorage.setItem("token", jwt);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("¡Login correcto!");

      if (user.rol === "cliente") window.location.href = "/";
      else if (user.rol === "camarero") window.location.href = "/camarero";
      else if (user.rol === "cocinero") window.location.href = "/cocina";
      else if (user.rol === "administrador") window.location.href = "/admin";
    } catch (err) {
      setError("Credenciales incorrectas o usuario no confirmado.");
    }
  };

  const handleEnviarReset = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        { email: emailReset }
      );
      toast.success("📧 Correo enviado para restablecer tu contraseña");
      setModalAbierto(false);
      setEmailReset("");
    } catch (err) {
      toast.error("❌ Error al enviar el correo. Verifica el email.");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: `url('/login.png')` }}
    >
      <form
        onSubmit={handleLogin}
        className="backdrop-blur-md bg-white/60 p-8 shadow-xl rounded-lg w-full max-w-md animate-fade-in"
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Inicia sesión
        </h2>

        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <label className="block font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block font-medium mb-1">Contraseña</label>
        <input
          type="password"
          className="w-full p-2 mb-2 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>

        <p
          className="text-sm text-center mt-3 text-blue-700 cursor-pointer hover:underline"
          onClick={() => setModalAbierto(true)}
        >
          ¿Olvidaste tu contraseña?
        </p>

        <p className="text-center text-sm mt-4">
          ¿No tienes cuenta?{" "}
          <a
            href="/register"
            className="text-blue-700 font-semibold hover:underline"
          >
            Regístrate
          </a>
        </p>
      </form>

      {/* Modal de restablecer contraseña */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-center mb-4">
              Restablecer contraseña
            </h3>
            <form onSubmit={handleEnviarReset} className="space-y-4">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={emailReset}
                onChange={(e) => setEmailReset(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Enviar correo
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="w-full text-gray-600 py-2 rounded hover:underline text-sm"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
