import Link from "next/link";

export default function Verificado() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-white text-center px-4">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-600 mb-4">¡Correo confirmado!</h1>
        <p className="text-gray-700 mb-6">
          Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesión y hacer reservas.
        </p>

        <Link href="/" passHref>
          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-full transition duration-200">
            Ir al inicio
          </button>
        </Link>
      </div>
    </div>
  );
}
