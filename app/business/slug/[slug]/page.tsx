import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ELEGANZA,
  getImageUrl,
  resolveBusinessHeroImage,
  resolveHeroVideoPoster,
} from "@/lib/publicBrand";
import { isVideoUrl } from "@/lib/media";
import { fetchBusiness, fetchServices } from "./_data";
import { PublicPageClient } from "./_components/PublicPageClient";
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

  // For video heroes the poster is a plain <img> (not next/image), so preload
  // it as the LCP element. Image heroes are already preloaded by next/image's
  // `priority`, so we don't double-fetch them here.
  const heroIsVideo = isVideoUrl(heroImage);
  const heroPoster = resolveHeroVideoPoster(business);

  return (
    <div
      className="min-h-screen text-[#222222]"
      style={{
        backgroundColor: ELEGANZA.background,
        backgroundImage:
          "radial-gradient(circle at 12% 8%, rgba(221,211,207,0.45), transparent 55%), radial-gradient(circle at 88% 0%, rgba(239,239,239,0.7), transparent 45%)",
      }}
    >
      {heroIsVideo && heroPoster && (
        <link rel="preload" as="image" href={heroPoster} fetchPriority="high" />
      )}
      {/*
        PublicPageClient handles all interactive state (auth, scroll, mobile menu)
        and renders the client-only sections (nav, hero, services, contact).
        PageFooter is server-rendered below the fold.
      */}
      <PublicPageClient
        business={business}
        services={services}
        slug={slug}
        heroImage={heroImage}
      />

      <PageFooter business={business} />
    </div>
  );
}
