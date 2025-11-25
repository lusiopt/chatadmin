import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // Removido - causava problemas com dependências
  basePath: '/chat',
  assetPrefix: '/chat',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admiywnhpbezcgtnebvw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
