'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

export default function Carta() {
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    fetch('http://localhost:1340/api/recetas?populate[producto][populate]=imagen,categoria&populate[receta_ingredientes][populate]=ingrediente')
      .then(res => res.json())
      .then(data => setRecetas(data.data || []));
  }, []);

  const agrupadas = {
    entrante: [],
    principal: [],
    postre: [],
  };

  recetas.forEach((r) => {
    const producto = r.attributes.producto.data?.attributes;
    const categoria = producto?.categoria || 'otros';
    if (agrupadas[categoria]) {
      agrupadas[categoria].push(r);
    }
  });

  const renderSeccion = (titulo, items) => (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-center mb-8">{titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((r, i) => {
          const producto = r.attributes.producto.data?.attributes;
          const imagen = producto?.imagen?.data?.attributes?.url;
          const nombre = producto?.nombre;
          const descripcion = producto?.descripcion;
          const precio = producto?.precio;

          const ingredientes = r.attributes.receta_ingredientes.data?.map((ri) => {
            const ing = ri.attributes.ingrediente.data?.attributes;
            return ing?.nombre || null;
          }).filter(Boolean);

          return (
            <div
              key={i}
              className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:scale-105 duration-300 overflow-hidden"
            >
              {imagen && (
                <Image
                  src={`http://localhost:1340${imagen}`}
                  alt={nombre}
                  width={400}
                  height={250}
                  className="w-full h-48 object-contain"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-blue-900">{nombre}</h3>
                <p className="text-sm text-gray-600 italic">{descripcion}</p>
                <p className="text-green-700 font-bold mt-2">{precio.toFixed(2)} €</p>
                {ingredientes?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold">Ingredientes:</p>
                    <ul className="text-sm list-disc list-inside text-gray-700">
                      {ingredientes.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-[url('/restaurant.jpg')] bg-cover bg-center min-h-screen">
      <Navbar />
      <div className="min-h-screen px-4 md:px-10 pt-[120px] pb-16">
        <h1 className="text-4xl font-bold text-center text-blue-900 mb-12">Nuestra Carta</h1>

        {renderSeccion('Entrantes', agrupadas.entrante)}
        {renderSeccion('Platos Principales', agrupadas.principal)}
        {renderSeccion('Postres', agrupadas.postre)}

        {recetas.length === 0 && (
          <p className="text-center text-gray-600 mt-10">No hay platos disponibles.</p>
        )}
      </div>
    </div>
  );
}
