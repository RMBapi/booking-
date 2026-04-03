"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/publicBrand";

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
      style={{ backgroundColor: BRAND.dark }}
    >
      <section
        className="w-full max-w-lg rounded-xl border p-8 md:p-10"
        style={{
          backgroundColor: BRAND.card,
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
          Missing Business Slug
        </h1>
        <p className="mt-3 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.72)" }}>
          Enter a slug to load a business website. Example URL format:
          <br />
          <span className="font-semibold text-white">/business/slug/my-business</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/70">
            Business Slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-business"
            className="w-full rounded-lg border px-4 py-3 text-white outline-none focus:ring-2"
            style={{
              borderColor: "rgba(255,255,255,0.2)",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          />
          <button
            type="submit"
            disabled={!normalizedSlug}
            className="w-full rounded-lg px-4 py-3 font-bold uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: BRAND.cta }}
          >
            Load Business Site
          </button>
        </form>
      </section>
    </main>
  );
}
