
/**
 * @fileoverview Archivo de configuración para Next.js.
 * Permite personalizar el comportamiento del framework, como la gestión de imágenes,
 * las redirecciones, las variables de entorno y las optimizaciones de compilación.
 * En este caso, se configuran los patrones de imagen remotos y las optimizaciones.
 */
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // En desarrollo y producción, esto redirige las solicitudes del lado del cliente /api/... al backend
    // Esto evita problemas de CORS.
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendUrl) {
      console.warn('ADVERTENCIA: NEXT_PUBLIC_API_BASE_URL no está configurada. Las reescrituras de API no funcionarán.');
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
       {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Añade el nombre de host de tu servicio backend de Render aquí
      // Por ejemplo, si la URL de tu servicio es https://mi-backend-123.onrender.com
      // el nombre de host sería 'mi-backend-123.onrender.com'
      {
        protocol: 'https',
        hostname: '*.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com',
      },
      {
        protocol: 'https',
        hostname: 'site-2206080.mozfiles.com',
      }
    ],
  },
  experimental: {
    serverActions: {
        bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
