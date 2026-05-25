import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ELEGANZA,
  getImageUrl,
  resolveBusinessHeroImage,
} from "@/lib/publicBrand";
import { fetchBusiness, fetchServices } from "./_data";
import { PublicPageClient } from "./_components/PublicPageClient";
import { ReviewsSection } from "./_components/ReviewsSection";
import { PageFooter } from "./_components/PageFooter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* ── Dynamic SEO metadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
        ? {
            images: [
              { url: getImageUrl(business.image || business.logo) || "" },
            ],
          }
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

  const heroImage = resolveBusinessHeroImage(business);

  return (
    <div
      className="min-h-screen text-[#222222]"
      style={{
        backgroundColor: ELEGANZA.background,
        backgroundImage:
          "radial-gradient(circle at 12% 8%, rgba(221,211,207,0.45), transparent 55%), radial-gradient(circle at 88% 0%, rgba(239,239,239,0.7), transparent 45%)",
      }}
    >
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
