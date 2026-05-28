"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/contexts";
import { getBusinessBySlug, getPublicServicesByBusinessSlug } from "@/services";
import { Business, Service, User } from "@/types";
import { resolveBusinessHeroImage } from "@/lib/publicBrand";
import { readSiteCache, writeSiteCache } from "@/lib/publicCache";
import { PageNavigation } from "./PageNavigation";

function resolveBusinessSlug(): string | null {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BUSINESS_SLUG || null;
  }
  return (
    localStorage.getItem("customer_businessSiteSlug") ||
    process.env.NEXT_PUBLIC_BUSINESS_SLUG ||
    null
  );
}

function extractServices(servicesRes: unknown): Service[] {
  const res = servicesRes as
    | { data?: Service[] | { data?: Service[] } }
    | undefined;
  if (Array.isArray(res?.data)) return res.data as Service[];
  const inner = (res?.data as { data?: Service[] } | undefined)?.data;
  return Array.isArray(inner) ? inner : [];
}

export function CustomerSiteNavigation() {
  const router = useRouter();
  const {
    getSession,
    logout: logoutRole,
    isLoading: authLoading,
  } = useRoleAuth();

  // Resolve slug synchronously on the very first render so we never wait a
  // render cycle (and a useEffect) before we can show anything.
  const [slug] = useState<string | null>(() => resolveBusinessSlug());

  // Hydrate from the session cache synchronously so the navbar paints
  // instantly when the user has already visited the public site this session.
  const cached = useMemo(() => readSiteCache(slug), [slug]);

  const [business, setBusiness] = useState<Business | null>(
    cached?.business ?? null,
  );
  const [services, setServices] = useState<Service[]>(cached?.services ?? []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authValidated, setAuthValidated] = useState(false);
  const [isCustomerForThisSite, setIsCustomerForThisSite] = useState(false);
  const [customerUser, setCustomerUser] = useState<User | null>(null);

  const customerSession = getSession("Customer");
  const customerToken = customerSession.token;
  const sessionUser = customerSession.user;
  const sessionUserId = sessionUser?.id;

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    (async () => {
      try {
        const [businessRes, servicesRes] = await Promise.all([
          getBusinessBySlug(slug),
          getPublicServicesByBusinessSlug(slug),
        ]);

        if (cancelled) return;

        const nextBusiness =
          businessRes?.success && businessRes.data
            ? (businessRes.data as Business)
            : null;
        const nextServices = extractServices(servicesRes);

        if (nextBusiness) setBusiness(nextBusiness);
        setServices(nextServices);
        writeSiteCache(slug, {
          business: nextBusiness ?? business,
          services: nextServices,
        });
      } catch {
        // Keep whatever we already have (cache or prior state).
      }
    })();

    return () => {
      cancelled = true;
    };
    // `business` intentionally omitted: it's only read to preserve a prior
    // value when the network returns nothing, not to re-trigger the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (authLoading || !slug) {
      setAuthValidated(false);
      return;
    }

    if (customerToken && sessionUser) {
      const storedSlug = localStorage.getItem("customer_businessSiteSlug");
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
    // sessionUser is read from getSession each render; only track stable id/token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, customerToken, sessionUserId, slug]);

  const homePath = slug ? `/business/slug/${slug}` : "/";
  const loginUrl = slug
    ? `/auth/login/customer?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent("/customer/bookings")}`
    : "/auth/login/customer";
  const signupUrl = slug
    ? `/auth/register?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent("/customer/bookings")}`
    : "/auth/register";

  const featuredService = services[0];
  const resolvedHeroImage = useMemo(
    () => resolveBusinessHeroImage(business),
    [business],
  );

  if (!business || !slug) return null;

  return (
    <PageNavigation
      business={business}
      slug={slug}
      heroImage={resolvedHeroImage}
      featuredService={featuredService}
      activeSection={null}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      scrollToSection={() => {}}
      authValidated={authValidated}
      isCustomerForThisSite={isCustomerForThisSite}
      customerUser={customerUser}
      onLogin={() => router.push(loginUrl)}
      onSignup={() => router.push(signupUrl)}
      onLogout={() => {
        logoutRole("Customer");
        router.push(homePath);
      }}
      onMyBookings={() => router.push("/customer/bookings")}
      onLogoClick={() => router.push(homePath)}
      onNavigateHome={() => router.push(homePath)}
      onNavigateContact={() => router.push(`${homePath}#bookings`)}
    />
  );
}
