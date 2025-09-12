/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'electronica.school',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'electronica-school.b-cdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configuración para optimizar Prisma en producción
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/client-db2']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client', '@prisma/client-db2')
    }
    return config
  }
};

module.exports = nextConfig;