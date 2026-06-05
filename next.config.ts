import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Modern formats first; next/image negotiates AVIF/WebP per request.
  // qualities allowlists the q90 we request for crisp UI screenshots.
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  // Keep the Figma Make export out of the Next.js compilation graph.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
