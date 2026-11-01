/** @type {import('next').NextConfig} */
const backendTarget = (process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000').replace(/\/$/, '');

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

