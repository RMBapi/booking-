"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBusinessBySlug, getPublicServicesByBusinessSlug } from "@/services";
import { Business, Service, User } from "@/types";
import { PageLoader } from "@/components";
import { useRoleAuth } from "@/contexts";
import { BRAND } from "@/lib/publicBrand";
import { HERO_FALLBACK } from "./_constants";
import { HeroSection } from "./_components/HeroSection";
import { ServicesGrid } from "./_components/ServicesGrid";
import { ReviewsSection } from "./_components/ReviewsSection";
import { ContactSection } from "./_components/ContactSection";
import { PageNavigation } from "./_components/PageNavigation";
import { PageFooter } from "./_components/PageFooter";

export default function PublicBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { getSession, logout: logoutRole, isLoading: authLoading } = useRoleAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState("");
  const [authValidated, setAuthValidated] = useState(false);
  const [isCustomerForThisSite, setIsCustomerForThisSite] = useState(false);
  const [customerUser, setCustomerUser] = useState<User | null>(null);

  const [activeSection, setActiveSection] = useState<"home" | "reviews" | "bookings">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const customerSession = getSession("Customer");
  const customerToken = customerSession.token;
  const sessionUser = customerSession.user;

  useEffect(() => {
    if (authLoading) {
      setAuthValidated(false);
      return;
    }
    if (customerToken && sessionUser) {
      const storedSlug =
        typeof window !== "undefined"
          ? localStorage.getItem("customer_businessSiteSlug")
          : null;
      if (storedSlug === slug) {
        setIsCustomerForThisSite(true);
        setCustomerUser(sessionUser);
      } else {
        setIsCustomerForThisSite(false);
        setCustomerUser(null);
      }
    } else {
      setIsCustomerForThisSite(false);
      setCustomerUser(null);
    }
    setAuthValidated(true);
  }, [authLoading, customerToken, sessionUser, slug]);

  useEffect(() => {
    if (!slug) return;
    const loadData = async () => {
      const [businessRes, servicesRes] = await Promise.allSettled([
        getBusinessBySlug(slug),
        getPublicServicesByBusinessSlug(slug),
      ]);

      if (businessRes.status === "fulfilled" && businessRes.value.success) {
        setBusiness(businessRes.value.data);
      } else {
        setError("Business not found");
      }

      if (
        servicesRes.status === "fulfilled" &&
        servicesRes.value.success &&
        Array.isArray(servicesRes.value.data)
      ) {
        setServices(
          servicesRes.value.data.filter(
            (s: Service) => s.status === "Active" && s.isActive,
          ),
        );
      }

      setLoading(false);
      setServicesLoading(false);
    };

    loadData();
  }, [slug]);

  const scrollToSection = (section: "home" | "reviews" | "bookings") => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace("#", "");
    if (hash && ["home", "reviews", "bookings"].includes(hash)) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        setActiveSection(hash as "home" | "reviews" | "bookings");
      }, 300);
    }
  }, [loading]);

  if (loading) return <PageLoader />;

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-brand-dark">
        <div className="text-center py-12 px-8 max-w-md rounded-lg bg-brand-card">
          <h1 className="text-3xl font-bold text-white mb-4">Business Not Found</h1>
          <p className="mb-6 text-white/50">
            {error || "The business you are looking for does not exist."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded text-white text-sm font-bold uppercase tracking-widest bg-brand-cta hover:brightness-110 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const heroImage = business.logoUrl || HERO_FALLBACK;
  const displayAddress = business.address || "Address not available";
  const displayPhone = business.phone || "Phone not available";
  const displayEmail = business.email || "Email not available";
  const returnUrl = `/business/slug/${slug}`;
  const featuredService = services[0];

  const goCustomerLogin = () => {
    router.push(
      `/auth/login/customer?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`,
    );
  };
  const goCustomerSignup = () => {
    router.push(
      `/auth/register?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`,
    );
  };

  return (
    <div className="min-h-screen text-white bg-brand-dark">
      <PageNavigation
        business={business}
        slug={slug}
        heroImage={heroImage}
        featuredService={featuredService}
        activeSection={activeSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        scrollToSection={scrollToSection}
        authValidated={authValidated}
        isCustomerForThisSite={isCustomerForThisSite}
        customerUser={customerUser}
        onLogin={goCustomerLogin}
        onSignup={goCustomerSignup}
        onLogout={() => {
          logoutRole("Customer");
          window.location.reload();
        }}
      />

      <main className="pt-16">
        <HeroSection
          business={business}
          heroImage={heroImage}
          displayAddress={displayAddress}
          featuredService={featuredService}
          slug={slug}
        />

        {/* Booking step bar */}
        <div
          className="w-full border-b bg-brand-card"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="max-w-5xl mx-auto flex items-center">
            {["SERVICES", "PROVIDER", "TIME", "CLIENT"].map((step, i) => (
              <div
                key={step}
                className="flex-1 text-center py-5 text-sm font-bold uppercase tracking-widest relative cursor-pointer transition-colors"
                style={{ color: i === 0 ? BRAND.accent : "rgba(255,255,255,0.45)" }}
              >
                {step}
                {i === 0 && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px]"
                    style={{ backgroundColor: BRAND.accent }}
                  />
                )}
                {i < 3 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-white/20">
                    |
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <ServicesGrid
          services={services}
          servicesLoading={servicesLoading}
          business={business}
          slug={slug}
          heroImage={heroImage}
        />

        <ReviewsSection />

        <ContactSection
          business={business}
          displayAddress={displayAddress}
          displayPhone={displayPhone}
          displayEmail={displayEmail}
          featuredService={featuredService}
          slug={slug}
          heroImage={heroImage}
        />
      </main>

      <PageFooter business={business} />
    </div>
  );
}
