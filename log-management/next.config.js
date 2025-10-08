/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  poweredByHeader: false,
  compress: true,

  // Custom webpack config for SQLite
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("better-sqlite3");
    }
    return config;
  },

  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "./logs.db",
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-here",
    LOG_RETENTION_DAYS: process.env.LOG_RETENTION_DAYS || "7",
    PAGINATION_SIZE: process.env.PAGINATION_SIZE || "50",
  },

  async rewrites() {
    return [
      {
        source: "/health",
        destination: "/api/health",
      },
    ];
  },
};

module.exports = nextConfig;
