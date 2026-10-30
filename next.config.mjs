import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  turbopack: {
    root: path.resolve('.'),
  },
};

export default nextConfig;
