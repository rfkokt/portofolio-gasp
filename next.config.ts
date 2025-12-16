import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['rss-parser', 'json5', 'undici', 'pocketbase', 'dotenv'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'images.placeholders.dev',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'pocketbase.rdev.cloud',
      },
    ],
  },
};

export default nextConfig;
