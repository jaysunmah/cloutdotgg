import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Transpile protobuf packages
  transpilePackages: ['@bufbuild/protobuf', '@connectrpc/connect', '@connectrpc/connect-web'],
  eslint: {
    // Ignore ESLint errors from generated files during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
