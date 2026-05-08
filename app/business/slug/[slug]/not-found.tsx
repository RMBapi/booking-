import Link from "next/link";
import { BRAND } from "@/lib/publicBrand";

export default function BusinessNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: BRAND.dark }}>
      <div className="text-center py-12 px-8 max-w-md rounded-lg" style={{ backgroundColor: BRAND.card }}>
        <h1 className="text-3xl font-bold text-white mb-4">Business Not Found</h1>
        <p className="mb-6 text-white/50">
          The business you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded text-white text-sm font-bold uppercase tracking-widest hover:brightness-110 transition-all"
          style={{ backgroundColor: BRAND.cta }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
