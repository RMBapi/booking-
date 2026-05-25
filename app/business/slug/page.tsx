"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ELEGANZA } from "@/lib/publicBrand";

export default function MissingBusinessSlugPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!normalizedSlug) return;
    router.push(`/business/slug/${encodeURIComponent(normalizedSlug)}`);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: ELEGANZA.background }}
    >
      <section
        className="w-full max-w-lg rounded border p-8 md:p-10"
        style={{
          backgroundColor: ELEGANZA.surface,
          borderColor: ELEGANZA.border,
        }}
      >
        <h1
          className="text-2xl md:text-3xl uppercase tracking-[0.2em]"
          style={{ color: ELEGANZA.ink }}
        >
          Missing Business Slug
        </h1>
        <p
          className="mt-3 text-sm md:text-base"
          style={{ color: ELEGANZA.inkMuted }}
        >
          Enter a slug to load a business website. Example URL format:
          <br />
          <span className="font-semibold" style={{ color: ELEGANZA.ink }}>
            /business/slug/my-business
          </span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/70">
            Business Slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-business"
            className="w-full rounded border px-4 py-3 outline-none focus:ring-2"
            style={{
              borderColor: ELEGANZA.border,
              backgroundColor: ELEGANZA.surface,
              color: ELEGANZA.ink,
            }}
          />
          <button
            type="submit"
            disabled={!normalizedSlug}
            className="w-full rounded px-4 py-3 font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: ELEGANZA.cta }}
            onMouseEnter={(e) => {
              if (!normalizedSlug) return;
              e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover;
            }}
            onMouseLeave={(e) => {
              if (!normalizedSlug) return;
              e.currentTarget.style.backgroundColor = ELEGANZA.cta;
            }}
          >
            Load Business Site
          </button>
        </form>
      </section>
    </main>
  );
}
