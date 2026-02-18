"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Clock3, Mail, MapPin, Phone, Star } from "lucide-react";
import { getBusinessBySlug, getPublicServicesByBusinessSlug } from "@/services";
import { Business, Service } from "@/types";
import { Card, Button, PageLoader, Modal, BookingForm } from "@/components";
import { useRoleAuth } from "@/contexts";

const HERO_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=80";
const PHILOSOPHY_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80";

const WEEKDAY_HOURS = "09:00 AM - 08:00 PM";
const SATURDAY_HOURS = "10:00 AM - 06:00 PM";

const formatPrice = (price: number) => {
  if (Number.isNaN(price)) return "$0.00";
  return `$${price.toFixed(2)}`;
};

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
  const [customerUser, setCustomerUser] = useState<any>(null);

  // Get customer session (independent of other role sessions)
  const customerSession = getSession("Customer");
  const customerToken = customerSession.token;
  const sessionUser = customerSession.user;
  
  // Create a stable identifier for the user that won't cause re-renders
  const customerIdentifier = useMemo(() => {
    return sessionUser ? `${sessionUser.id}-${sessionUser.email}` : null;
  }, [sessionUser?.id, sessionUser?.email]);

  // Validate customer authentication for this specific business site
  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) {
      setAuthValidated(false);
      return;
    }

    // Check if there's a customer token and user
    if (customerToken && sessionUser) {
      // Check if customer is associated with this specific business site
      const storedBusinessSiteSlug = typeof window !== "undefined" 
        ? localStorage.getItem("customer_businessSiteSlug") 
        : null;
      
      if (storedBusinessSiteSlug === slug) {
        // Customer is logged in and associated with this business site
        setIsCustomerForThisSite(true);
        setCustomerUser(sessionUser);
      } else {
        // Customer is logged in but not for this site
        setIsCustomerForThisSite(false);
        setCustomerUser(null);
      }
    } else {
      // No customer token or user
      setIsCustomerForThisSite(false);
      setCustomerUser(null);
    }
    
    setAuthValidated(true);
  }, [authLoading, customerToken, customerIdentifier, slug]);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const data = await getBusinessBySlug(slug);
        if (data.success) {
          setBusiness(data.data);
        } else {
          setError("Business not found");
        }
      } catch {
        setError("Failed to load business");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBusiness();
    }
  }, [slug]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!slug) return;
      
      // Only fetch services if business exists
      if (!business) {
        setServicesLoading(false);
        return;
      }
      
      try {
        const data = await getPublicServicesByBusinessSlug(slug);
        if (data.success && Array.isArray(data.data)) {
          // Backend already filters for Active status and isActive=true
          // But we keep this as a safety measure
          const activatedServices = data.data.filter(
            (service: Service) => service.status === "Active" && service.isActive === true
          );
          setServices(activatedServices);
        } else {
          // If response is not successful, set empty array
          setServices([]);
        }
      } catch (err) {
        // Enhanced error logging for debugging - log each property separately
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("  Failed to load services:");
        console.error("  Slug:", slug);
        console.error("  Business ID:", business?.id);
        console.error("  Error Message:", errorMessage);
        console.error("  Full Error:", err);
        
        // Don't set error state for services - just show empty list
        // This allows the page to still display business info even if services fail
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    if (slug && business) {
      fetchServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, business?.id]); // Use business?.id instead of business object to avoid dependency array size changes

  if (loading) {
    return <PageLoader />;
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="text-center py-12 max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Business Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The business you are looking for does not exist."}
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const heroImage = business.logoUrl || HERO_FALLBACK_IMAGE;
  const philosophyImage = business.logoUrl || PHILOSOPHY_FALLBACK_IMAGE;
  const featuredService = services[0];
  const description =
    business.description ||
    `${business.name} offers precision grooming and personalized care in a calm, detail-driven space.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f3ef] via-[#f2f2f2] to-[#ececec] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#f8f6f3]/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[1360px] items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 uppercase tracking-[0.25em] text-zinc-500 transition hover:text-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Exit Preview
            </button>
            <span className="hidden h-6 w-px bg-zinc-300 md:block" />
            <p className="text-2xl font-extrabold tracking-tight text-zinc-900 md:text-3xl">{business.name}</p>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {authValidated && isCustomerForThisSite && customerUser ? (
              <>
                <span className="hidden text-sm font-medium text-zinc-600 md:inline">
                  {customerUser.firstName} {customerUser.lastName}
                </span>
                <Button
                  size="sm"
                  className="rounded-full bg-zinc-900 px-6 text-white hover:bg-zinc-800"
                  onClick={() => {
                    logoutRole("Customer");
                    window.location.reload();
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 text-zinc-700 hover:bg-zinc-200/70"
                  onClick={() => {
                    const returnUrl = `/business/slug/${slug}`;
                    router.push(
                      `/auth/login/customer?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`
                    );
                  }}
                >
                  Customer Login
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-zinc-900 px-6 text-white hover:bg-zinc-800"
                  onClick={() => {
                    const returnUrl = `/business/slug/${slug}`;
                    router.push(
                      `/auth/register?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`
                    );
                  }}
                >
                  Join Now
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pb-16">
        <section className="relative h-[72vh] min-h-[520px] overflow-hidden">
          <img
            src={heroImage}
            alt={`${business.name} storefront`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />

          <div className="absolute inset-0 mx-auto flex w-full max-w-[1360px] items-center justify-center px-5 md:px-10">
            <div className="max-w-3xl text-center text-white">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-zinc-100">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Premium Service
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Refine Your
                <br />
                <span className="bg-gradient-to-r from-amber-200 to-amber-50 bg-clip-text font-light italic text-transparent">
                  Daily Ritual.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-200 md:text-xl">
                Experience a new standard of personal grooming in a space designed for clarity and
                relaxation.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {featuredService ? (
                  <Modal>
                    <Modal.Open opens={`booking-featured-${featuredService.id}`}>
                      <button className="inline-flex min-h-[48px] items-center gap-3 rounded-full bg-white px-8 py-3 text-base font-semibold text-zinc-900 transition hover:bg-amber-100">
                        Book Your Session
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Modal.Open>
                    <Modal.Body
                      name={`booking-featured-${featuredService.id}`}
                      size="full"
                      className="w-full max-w-6xl p-0"
                    >
                      <BookingForm
                        service={featuredService}
                        businessSlug={slug}
                        businessId={business.id}
                        heroImageUrl={heroImage}
                        businessName={business.name}
                        onClose={() => {}}
                      />
                    </Modal.Body>
                  </Modal>
                ) : (
                  <button
                    onClick={() =>
                      document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex min-h-[48px] items-center gap-3 rounded-full bg-white px-8 py-3 text-base font-semibold text-zinc-900 transition hover:bg-amber-100"
                  >
                    Explore Services
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() =>
                    document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex min-h-[48px] items-center rounded-full border border-white/40 bg-white/10 px-10 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  View Services
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 grid w-full max-w-[1200px] items-center gap-12 px-5 md:mt-24 md:grid-cols-2 md:px-10">
          <div className="text-center md:text-left">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-amber-700">The Philosophy</p>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 md:text-5xl">
              Crafting excellence with every detail.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 md:text-xl">{description}</p>

            <div className="mt-12 flex justify-center gap-12 md:justify-start md:gap-16">
              <div>
                <p className="text-4xl font-bold text-zinc-900 md:text-5xl">{services.length}+</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Active Services
                </p>
              </div>
              <div>
                <p className="text-4xl font-bold text-zinc-900 md:text-5xl">
                  {new Date(business.createdAt).getFullYear()}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Since</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[3rem] shadow-lg">
            <img
              src={philosophyImage}
              alt={`${business.name} interior`}
              className="h-[680px] w-full object-cover"
            />
          </div>
        </section>

        <section id="services-section" className="mx-auto mt-20 w-full max-w-[1280px] px-5 md:mt-24 md:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-700">Our Offerings</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-zinc-900 md:text-5xl">Curated Services</h2>
            <p className="mt-4 text-lg font-medium leading-snug text-zinc-600 md:text-xl">
              All services include a complimentary consultation and premium styling products.
            </p>
          </div>

          {servicesLoading ? (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={`service-loading-${index}`}
                  className="h-80 animate-pulse rounded-[2rem] border border-zinc-200 bg-zinc-100"
                />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-12 text-center">
              <p className="text-2xl font-semibold text-zinc-800">No active services are listed right now.</p>
              <p className="mt-2 text-lg text-zinc-500">Please check back soon or reach out for assistance.</p>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const servicePrice = Number(service.price);
                return (
                  <div
                    key={service.id}
                    className="rounded-[2rem] border border-zinc-200 bg-[#f7f7f7] p-8 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-3xl font-bold text-zinc-900 md:text-4xl">
                        {service.priceDisplayMode ? formatPrice(servicePrice) : "Custom"}
                      </p>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Clock3 className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">{service.name}</h3>
                    <p className="mt-3 min-h-[88px] text-base leading-relaxed text-zinc-600 md:text-lg">
                      {service.description || "Tailored service with precise execution and careful finishing."}
                    </p>
                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Booking Available
                    </p>

                    <Modal>
                      <Modal.Open opens={`booking-${service.id}`}>
                        <button className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-zinc-900 px-6 text-base font-bold text-white transition hover:bg-zinc-800">
                          Book Now
                        </button>
                      </Modal.Open>
                      <Modal.Body name={`booking-${service.id}`} size="full" className="w-full max-w-6xl p-0">
                        <BookingForm
                          service={service}
                          businessSlug={slug}
                          businessId={business.id}
                          heroImageUrl={heroImage}
                          businessName={business.name}
                          onClose={() => {}}
                        />
                      </Modal.Body>
                    </Modal>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mx-auto mt-20 w-full max-w-[1200px] px-5 md:mt-24 md:px-10">
          <div className="overflow-hidden rounded-[3.5rem] bg-[#171212] text-white">
            <div className="grid md:grid-cols-2">
              <div className="space-y-8 p-10 md:p-14">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-200">Get In Touch</p>
                <h2 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                  Visit us in the
                  <br />
                  heart of the city.
                </h2>

                <div className="space-y-6">
                  {business.address && (
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                        <MapPin className="h-6 w-6 text-zinc-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Address</p>
                        <p className="mt-1 text-xl font-semibold text-zinc-100 md:text-2xl">{business.address}</p>
                      </div>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                        <Phone className="h-6 w-6 text-zinc-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Phone</p>
                        <a
                          href={`tel:${business.phone}`}
                          className="mt-1 block text-xl font-semibold text-zinc-100 transition hover:text-white md:text-2xl"
                        >
                          {business.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                        <Mail className="h-6 w-6 text-zinc-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Email</p>
                        <a
                          href={`mailto:${business.email}`}
                          className="mt-1 block text-xl font-semibold text-zinc-100 transition hover:text-white md:text-2xl"
                        >
                          {business.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/10 p-10 md:p-14">
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 md:p-10">
                  <h3 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">Operating Hours</h3>
                  <div className="mt-8 space-y-5 text-zinc-200">
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Mon - Fri</p>
                      <p className="text-lg font-semibold md:text-xl">{WEEKDAY_HOURS}</p>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Saturday</p>
                      <p className="text-lg font-semibold md:text-xl">{SATURDAY_HOURS}</p>
                    </div>
                    <div className="flex items-center justify-between pb-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Sunday</p>
                      <p className="text-lg font-semibold md:text-xl">Closed</p>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      business.address || business.name
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-white px-6 text-lg font-bold text-zinc-900 transition hover:bg-amber-100"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
