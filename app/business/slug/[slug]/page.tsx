import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getImageUrl } from "@/lib/publicBrand";
import { HERO_FALLBACK } from "./_constants";
import { fetchBusiness, fetchServices } from "./_data";
import { PublicPageClient } from "./_components/PublicPageClient";
import { ReviewsSection } from "./_components/ReviewsSection";
import { PageFooter } from "./_components/PageFooter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* ── Dynamic SEO metadata ─────────────────────────────────────────────── */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusiness(slug);
  if (!business) return { title: "Business Not Found" };

  return {
    title: `${business.name} | Book an Appointment`,
    description:
      business.description ||
      `Browse services and book your next appointment with ${business.name}.`,
    openGraph: {
      title: `${business.name} | Book an Appointment`,
      description:
        business.description ||
        `Browse services and book your next appointment with ${business.name}.`,
      type: "website",
      ...(business.image || business.logo
        ? { images: [{ url: getImageUrl(business.image || business.logo) || "" }] }
        : {}),
    },
  };
}

/* ── Server Component page ────────────────────────────────────────────── */

export default async function PublicBusinessPage({ params }: PageProps) {
  const { slug } = await params;

  // Parallel server-side data fetching — no loading spinner needed
  const [business, services] = await Promise.all([
    fetchBusiness(slug),
    fetchServices(slug),
  ]);

  if (!business) notFound();

  const heroImage =
    getImageUrl(business.image) ||
    getImageUrl(business.logoUrl) ||
    HERO_FALLBACK;

  return (
    <div className="min-h-screen text-white bg-brand-dark">
      {/*
        PublicPageClient handles all interactive state (auth, scroll, mobile menu)
        and renders the client-only sections (nav, hero, services, contact).
        ReviewsSection and PageFooter are server-rendered below the fold.
      */}
      <PublicPageClient
        business={business}
        services={services}
        slug={slug}
        heroImage={heroImage}
      />

      {/* Server-rendered sections — zero JS, instant HTML */}
      <ReviewsSection />
      <PageFooter business={business} />
    </div>
  );
}
