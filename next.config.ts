import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // Prefer explicit backend URL; fall back to localhost:3000
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
