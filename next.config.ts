import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output для Docker - автоматически создает минимальный production build
  output: 'standalone',
  
  // Отключена оптимизация изображений (для совместимости с Docker без sharp)
  images: {
    unoptimized: true,
  },
  
  // TypeScript и ESLint настройки для production
  typescript: {
    // Во время production сборки не останавливаемся на type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Во время production сборки не останавливаемся на eslint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
