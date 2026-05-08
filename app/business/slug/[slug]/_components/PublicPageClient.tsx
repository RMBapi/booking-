"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Business, Service, User } from "@/types";
import { useRoleAuth } from "@/contexts";
import { BRAND } from "@/lib/publicBrand";
import { PageNavigation } from "./PageNavigation";
import { HeroSection } from "./HeroSection";
import { ServicesGrid } from "./ServicesGrid";
import { ContactSection } from "./ContactSection";

interface PublicPageClientProps {
  business: Business;
  services: Service[];
  slug: string;
  heroImage: string;
}

export function PublicPageClient({
  business,
  services,
  slug,
  heroImage,
}: PublicPageClientProps) {
  const router = useRouter();
  const { getSession, logout: logoutRole, isLoading: authLoading } = useRoleAuth();

  const [authValidated, setAuthValidated] = useState(false);
  const [isCustomerForThisSite, setIsCustomerForThisSite] = useState(false);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<"home" | "reviews" | "bookings">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const customerSession = getSession("Customer");
  const customerToken = customerSession.token;
  const sessionUser = customerSession.user;
  const sessionUserId = sessionUser?.id;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, customerToken, sessionUserId, slug]);

  const scrollToSection = (section: "home" | "reviews" | "bookings") => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && ["home", "reviews", "bookings"].includes(hash)) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        setActiveSection(hash as "home" | "reviews" | "bookings");
      }, 300);
    }
  }, []);

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
    <>
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
        onMyBookings={() => router.push("/customer/bookings")}
      />

      <main className="pt-18 md:pt-20 lg:pt-22">
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
          business={business}
          slug={slug}
          heroImage={heroImage}
        />

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
    </>
  );
}
