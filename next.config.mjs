/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    turbo: false, // 🔧 Esto desactiva Turbopack y vuelve a Webpack
  },
};

export default nextConfig;
