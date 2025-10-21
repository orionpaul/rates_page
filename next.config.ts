import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Image optimization for all devices (mobile to 4K TVs)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Add responsive image sizes for all devices
    deviceSizes: [320, 375, 425, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  // Ensure compatibility with older browsers and Smart TVs
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
