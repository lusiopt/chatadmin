import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // Removido - causava problemas com dependências
  basePath: '/chat',
  assetPrefix: '/chat',
};

export default nextConfig;
