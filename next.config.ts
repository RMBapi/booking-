import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  // Strip console.* (except errors/warnings) from the production bundle so the
  // verbose HTTP/debug logging never ships to end users.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  images: {
    // Aggressively cache optimized remote images (hero, logos) for 1 year.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
      {
        protocol: "https",
        hostname: "cbnhbwliowpepnrocvgl.supabase.co",
        pathname: "/storage/v1/object/public/uploads/**",
      },
    ],
  },
  async headers() {
    const IMMUTABLE = "public, max-age=31536000, immutable";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Static assets in /public (images, video, GIF loader, fonts) — these are
      // content-stable, so cache them for a year and serve from disk on reload.
      {
        source:
          "/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|mp4|webm|mov|woff|woff2|ttf|otf|eot)",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      // Hashed Next.js build assets are already immutable; make it explicit.
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
    ];
  },
  async rewrites() {
    // Prefer explicit backend URL; fall back to localhost:3000
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL;

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    // Prevent stale disk cache from referencing deleted vendor-chunks in dev
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
