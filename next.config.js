// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // 👈 Esto desactiva Turbopack
  },
};

module.exports = nextConfig;
