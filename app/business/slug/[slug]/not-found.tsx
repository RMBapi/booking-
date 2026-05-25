import Link from "next/link";
import { ELEGANZA } from "@/lib/publicBrand";

export default function BusinessNotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: ELEGANZA.background }}
    >
      <div
        className="text-center py-12 px-8 max-w-md rounded border"
        style={{
          backgroundColor: ELEGANZA.surface,
          borderColor: ELEGANZA.border,
        }}
      >
        <h1
          className="text-3xl uppercase tracking-[0.2em] mb-4"
          style={{ color: ELEGANZA.ink }}
        >
          Business Not Found
        </h1>
        <p className="mb-6" style={{ color: ELEGANZA.inkMuted }}>
          The business you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
          style={{ backgroundColor: ELEGANZA.cta }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ELEGANZA.cta;
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
