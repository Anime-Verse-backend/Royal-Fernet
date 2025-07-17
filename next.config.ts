
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Add the hostname of your Render backend service here
      // For example, if your service URL is https://my-backend-123.onrender.com
      // the hostname would be 'my-backend-123.onrender.com'
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
