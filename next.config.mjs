/**
 * @type {import('next').NextConfig}
 */
import dotenv from 'dotenv';

// Cargar variables de entorno desde archivo .env
dotenv.config();

const nextConfig = {
  reactStrictMode: true,
  
  // Permitir URLs externas para imágenes
  images: {
    domains: [
      'assets.coingecko.com',
      'flagcdn.com',
      'v6.exchangerate-api.com'
    ],
  },
  
  // Configuración para llamadas a APIs externas
  async rewrites() {
    return [
      {
        source: '/api/exchange-rates/:path*',
        destination: `https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY}/:path*`,
      },
      {
        source: '/api/alpha-vantage/:path*',
        destination: `https://www.alphavantage.co/query/:path*`,
      },
    ];
  },
};

export default nextConfig;
