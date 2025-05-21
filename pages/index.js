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

      {/* Las secciones inferiores no necesitan cambios */}
      {/* Sección experiencia, galería, funcionalidades, sellos y footer */}
    </div>
  );
}
