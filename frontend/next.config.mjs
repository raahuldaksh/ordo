/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const backendTarget = (
  process.env.BACKEND_INTERNAL_URL ||
  (isProd ? 'https://ordo-z65h.onrender.com' : 'http://localhost:5000')
).replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendTarget}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
