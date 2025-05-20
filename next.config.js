// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignorar errores de ESLint al hacer build
  },
  experimental: {
    turbo: {}, // ✅ Esto evita el error de que sea booleano
  },
};

module.exports = nextConfig;
