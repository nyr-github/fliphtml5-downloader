import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Image optimization disabled - images load directly from source CDN
  // to avoid Vercel bandwidth charges (76GB+ outgoing traffic)
  images: {
    unoptimized: true, // All images bypass Next.js optimization
  },
  // Cloudflare Workers 无法加载原生 sharp 二进制；将其排除出 server bundle。
  // 对 Vercel/VPS 无副作用（未安装 sharp 时该项被忽略）。
  serverExternalPackages: ["sharp"],
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
