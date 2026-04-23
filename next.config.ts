import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**", // This allows any path under the hostname
      },
      {
        protocol: "https",
        hostname: "online.fliphtml5.com",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"], // 优化图片格式
    minimumCacheTTL: 60 * 60 * 24 * 30, // 缓存30天
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },
  output: "standalone",
  transpilePackages: ["motion"],
  // 性能优化
  compress: true,
  poweredByHeader: false,
  webpack: (config, { dev }) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === "true") {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
