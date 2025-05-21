"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import { Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Navbar from '../components/Navbar';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    async function fetchUser() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('token');
          return;
        }

        const userData = await res.json();
        setUser(userData);
      } catch (error) {
        console.error('Error comprobando usuario:', error.message);
      }
    }

    fetchUser();
  }, []);

  const fadeInVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const Section = ({ children }) => {
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
    return (
      <motion.div
        ref={ref}
        variants={fadeInVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="mb-16"
      >
        {children}
      </motion.div>
    );
  };

  return (
    <div>
      <Navbar />
      <div className="relative h-screen flex items-center justify-center">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 4000 }}
          loop={true}
          className="absolute top-0 left-0 w-full h-full"
        >
          <SwiperSlide>
            <img src="/restaurant.jpg" alt="Restaurante" className="w-full h-full object-cover" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="/imagen1.jpg" alt="Comida" className="w-full h-full object-cover" />
          </SwiperSlide>
          <SwiperSlide>
            <img src="/imagen2.jpg" alt="Cocina" className="w-full h-full object-cover" />
          </SwiperSlide>
        </Swiper>

        <div className="absolute text-white text-center z-10 px-4">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">Bienvenido a Nuestro Restaurante</h2>
          <p className="text-xl md:text-2xl drop-shadow">Mar de Fulles - Gastronomía y Naturaleza</p>
        </div>

        {user && (
          <div className="absolute bottom-16 z-10">
            <button
              onClick={() => router.push('/reservas')}
              className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-blue-100 transition"
            >
              Reservar mesa
            </button>
          </div>
        )}
      </div>
      {/* Sección experiencia */}
      <Section>
        <section className="text-center py-14 px-6 bg-gray-50">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">EXPERIENCIA NATURAL EN LA SIERRA DEL ESPADÁN</h2>
          <p className="text-xl text-gray-700 mb-6">
            Un restaurante que surge de lo más profundo de la naturaleza
          </p>
          <div className="flex justify-center mb-6">
            <img
              src="/sierra.jpg"
              alt="Sierra"
              className="rounded-lg shadow-lg w-full md:w-3/4 lg:w-2/4"
            />
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Somos un restaurante comprometido con el turismo sostenible. Ofrecemos una experiencia única en plena Sierra del Espadán, 
            con gastronomía local elaborada con productos frescos y sin químicos. Nuestra ubicación natural y la atención especial harán 
            de tu visita un momento inolvidable.
          </p>
        </section>
      </Section>

      {/* Galería horizontal */}
      <Section>
        <section className="py-10 bg-white">
          <Swiper
            spaceBetween={20}
            slidesPerView={1.2}
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            autoplay={{ delay: 3000 }}
            loop={true}
            className="px-4"
          >
            {[
              '/plato1.jpg',
              '/plato2.jpg',
              '/plato3.jpg',
              '/plato4.jpg',
              '/plato5.jpg',
              '/plato6.jpg',
              '/plato7.jpeg',
              '/plato7.jpg',
            ].map((src, i) => (
              <SwiperSlide key={i}>
                <img
                  src={src}
                  alt={`Galería ${i + 1}`}
                  className="rounded-lg object-cover h-64 w-full shadow-lg"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      </Section>

      {/* Funcionalidades */}
      <Section>
        <section className="bg-gray-100 py-14 px-6">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-10">
            ¿Qué ofrece RestoraTech?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Reserva Online',
                desc: 'Selecciona día, hora y comensales desde tu móvil.',
              },
              {
                title: 'Pedidos por QR',
                desc: 'Escanea el código en la mesa y haz tu pedido sin esperas.',
              },
              {
                title: 'Cocina Sostenible',
                desc: 'Platos con ingredientes frescos, locales y sin químicos.',
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                variants={fadeInVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-lg text-center hover:-translate-y-2 hover:shadow-2xl transition"
              >
                <h3 className="text-2xl font-semibold mb-3 text-blue-900">{card.title}</h3>
                <p className="text-gray-700">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </Section>

      {/* Sellos de calidad */}
      <Section>
        <section className="py-14 bg-white text-center">
          <h2 className="text-2xl font-bold mb-10 text-blue-900">SELLOS DE CALIDAD</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 px-6 max-w-7xl mx-auto">

            {[
              '/logo1.png',
              '/logo2.png',
              '/logo3.png',
              '/logo4.png',
              '/logo5.png',
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Sello ${i + 1}`}
                className="h-20 object-contain"
              />
            ))}
          </div>
        </section>
      </Section>

      {/* Footer */}
      <footer className="bg-[#1c1f26] text-white py-12 px-6 mt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Izquierda: contacto */}
          <div className="text-sm space-y-2">
            <p className="font-bold text-lg">Hotel Mar de Fulles</p>
            <p>Polígono 5, Parcela 69</p>
            <p>12609 - Alfondeguilla, Castellón</p>
            <p>Teléfono: +34 669 211 569</p>
            <p>info@mardefulles.es</p>
          </div>

          {/* Centro: logo y redes */}
          <div className="flex flex-col items-center gap-4">
            <img src="/logotipo.png" alt="Logo" className="h-16" />
            <div className="flex gap-4">
              <a href="#"><img src="/facebook.png" alt="Instagram" className="h-5" /></a>
              <a href="#"><img src="/instagram.png" alt="Facebook" className="h-5" /></a>
              <a href="#"><img src="/youtube.png" alt="YouTube" className="h-5" /></a>
            </div>
          </div>

          {/* Derecha: frases inspiradoras */}
          <div className="text-sm italic text-gray-300 space-y-2">
            <p>"Donde la gastronomía y la naturaleza se abrazan."</p>
            <p>"Cocinar con alma, servir con conciencia."</p>
            <p>"Respira. Saborea. Conecta."</p>
          </div>
        </div>

        <p className="text-center text-xs mt-10 text-gray-400">
          © 2025 RestoraTech – Desarrollado con ❤️ por Iñaki Borrego
        </p>
      </footer>
      
    </div>
  );
}
