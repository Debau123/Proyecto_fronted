'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { API_URL } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, password, passwordConfirmation: confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Contraseña actualizada. Redirigiendo...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast.error(data?.error?.message || 'Error al actualizar la contraseña');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[url('/restaurant.jpg')] bg-cover bg-center min-h-screen">
      <Navbar />
      <div className="min-h-screen px-4 md:px-10 pt-[120px] pb-16 flex items-center justify-center">
        <div className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">Restablecer Contraseña</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              {loading ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
