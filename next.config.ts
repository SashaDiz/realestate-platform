import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack для разработки
  turbopack: {
    root: __dirname,
  },
  
  // Standalone output для Docker
  output: 'standalone',
  
  // Отключена оптимизация изображений для совместимости
  images: {
    unoptimized: true,
  },
  
  // Trailing slash для URL
  trailingSlash: true,
};

export default nextConfig;
