import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "sqlite3"],
  },

  // Custom webpack config for SQLite
  webpack: (
    config: any,
    { buildId, dev, isServer, defaultLoaders, webpack }: any
  ) => {
    if (isServer) {
      config.externals.push("better-sqlite3");
    }
    return config;
  },

  // Environment variables for log management
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "./logs.db",
    LOG_DIRECTORY: process.env.LOG_DIRECTORY || "./logs",
    LOG_RETENTION_DAYS: process.env.LOG_RETENTION_DAYS || "30",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  },
};

export default nextConfig;
