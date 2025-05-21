import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

      alert("¡Login correcto!");

      if (user.rol === "cliente") window.location.href = "/";
      else if (user.rol === "camarero") window.location.href = "/camarero";
      else if (user.rol === "cocinero") window.location.href = "/cocina";
      else if (user.rol === "administrador") window.location.href = "/admin";
    } catch (err) {
      setError("Credenciales incorrectas o usuario no confirmado.");
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
          className="w-full p-2 mb-6 border border-gray-300 rounded"
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
    </div>
  );
}
