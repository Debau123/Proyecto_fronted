import { useState } from "react";
import axios from "axios";

const API_URL = "https://restoratech-backend-production.up.railway.app";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [formularioVisible, setFormularioVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/auth/local/register`, {
        username,
        email,
        password,
        rol: "cliente",
      });

      setFormularioVisible(false);
    } catch (err) {
      console.error("Error de registro:", err);

      if (
        err.response &&
        err.response.data?.error?.message?.includes("email is already taken")
      ) {
        setError("⚠️ Este email ya está registrado.");
      } else if (err.response?.data?.error?.message) {
        setError("❌ " + err.response.data.error.message);
      } else {
        setError("⚠️ Ha ocurrido un error inesperado al registrar.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 transition-all"
      style={{ backgroundImage: `url('/registre.jpg')` }}
    >
      <div className="w-full max-w-md">
        <form
          onSubmit={handleRegister}
          className={`transition-all duration-700 ease-in-out backdrop-blur-md bg-white/60 p-8 shadow-xl rounded-lg animate-fade-in ${
            formularioVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
            Crea tu cuenta
          </h2>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <label className="block font-medium mb-1">Nombre de usuario</label>
          <input
            type="text"
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

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
            disabled={isSubmitting}
            className={`w-full p-2 rounded transition text-white ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        {!formularioVisible && (
          <div className="transition-opacity duration-700 ease-in-out opacity-100 text-center backdrop-blur-md bg-white/70 mt-4 p-6 rounded-lg shadow-xl animate-fade-in">
            <h2 className="text-2xl font-semibold text-green-700 mb-2">¡Registro completado!</h2>
            <p className="text-gray-700">
              Te hemos enviado un correo de confirmación a:
            </p>
            <p className="font-medium text-blue-800 mt-1">{email}</p>
            <p className="mt-4 text-sm text-gray-500">
              Por favor, revisa tu bandeja de entrada (o spam).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
