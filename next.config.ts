import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Production optimizations for all devices
  productionBrowserSourceMaps: false, // Reduce bundle size
  poweredByHeader: false, // Remove X-Powered-By header
  // Note: SWC minification is enabled by default in Next.js 15+

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
    unoptimized: false, // Ensure optimization is enabled
  },

  // Enhanced compiler options for maximum compatibility
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Remove React DevTools in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['react', 'react-dom'],
  },

  // Webpack optimization for old browsers and TV OS
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Aggressive minification
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Headers for better caching and compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Enable CORS for all TV browsers
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          // Cache static assets aggressively
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Compatibility headers for old browsers
          {
            key: 'X-UA-Compatible',
            value: 'IE=edge',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
