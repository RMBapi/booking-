import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cbnhbwliowpepnrocvgl.supabase.co",
        pathname: "/storage/v1/object/public/uploads/**",
      },
    ],
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
