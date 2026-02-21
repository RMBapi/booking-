"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  Clock,
  Mail,
  MapPin,
  Phone,
  Star,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import { getBusinessBySlug, getPublicServicesByBusinessSlug } from "@/services";
import { Business, Service } from "@/types";
import { Card, Button, PageLoader, Modal, BookingForm } from "@/components";
import { useRoleAuth } from "@/contexts";
import { motion } from "framer-motion";

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

const getServiceDurationLabel = (service: Service) => {
  const enrichedService = service as Service & {
    durationMinutes?: number;
    duration?: number;
    durationInMinutes?: number;
  };

  const duration =
    enrichedService.durationMinutes ??
    enrichedService.duration ??
    enrichedService.durationInMinutes;

  if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
    return `${Math.round(duration)} min`;
  }

  return "Flexible";
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getServiceDescriptionLabel = (service: Service) => {
  const raw = service.description?.trim() || "";
  if (!raw || /^\d+(\.\d+)?$/.test(raw)) {
    return "A premium service tailored to your needs with expert care and attention to detail.";
  }
  return raw;
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
  const philosophyDescription =
    business.description ||
    `${business.name} was born from the idea that personal care is more than a service. We combine traditional craft with a modern atmosphere so each visit feels focused, calm, and premium.`;
  const displayAddress = business.address || "123 Coastal Park, Bengaluru 560001";
  const displayPhone = business.phone || "+91 98765 43210";
  const displayEmail = business.email || "hello@quietharbor.in";
  const openedYear = new Date(business.createdAt).getFullYear();
  const operatingHours = [
    { day: "Mon - Fri", hours: WEEKDAY_HOURS },
    { day: "Saturday", hours: SATURDAY_HOURS },
    { day: "Sunday", hours: "Closed" },
  ];
  const servicesGridClass =
    services.length >= 3
      ? "grid grid-cols-1 md:grid-cols-3 gap-8"
      : services.length === 2
      ? "grid grid-cols-1 md:grid-cols-2 gap-8"
      : "grid grid-cols-1 md:max-w-[420px] gap-8";

  const goCustomerLogin = () => {
    const returnUrl = `/business/slug/${slug}`;
    router.push(
      `/auth/login/customer?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`
    );
  };

  const goCustomerSignup = () => {
    const returnUrl = `/business/slug/${slug}`;
    router.push(
      `/auth/register?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 selection:bg-stone-900 selection:text-white">
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-50 border-b border-stone-100/50 px-8 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-900"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Exit Preview
          </button>
          <span className="hidden h-4 w-px bg-stone-100 sm:block" />
          <span className="text-xl font-bold tracking-tight text-stone-900">{business.name}</span>
        </div>

        <div className="flex items-center gap-6">
          {authValidated && isCustomerForThisSite && customerUser ? (
            <>
              <span className="hidden text-[13px] font-bold text-stone-500 sm:block">
                {customerUser.firstName} {customerUser.lastName}
              </span>
              <button
                onClick={() => {
                  logoutRole("Customer");
                  window.location.reload();
                }}
                className="inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-6 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-stone-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={goCustomerLogin}
                className="text-[13px] font-bold text-stone-500 transition-colors hover:text-stone-900"
              >
                Customer Login
              </button>
              <button
                onClick={goCustomerSignup}
                className="inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-6 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800"
              >
                Join Now
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="pt-20">
        <section className="relative flex h-[85vh] w-full items-center overflow-hidden px-8 lg:px-16">
          <div className="absolute inset-0 z-0">
            <img
              src={heroImage}
              alt={`${business.name} hero`}
              className="h-full w-full object-cover saturate-[0.9] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-stone-900/40" />
          </div>

          <div className="relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="mb-6 flex items-center gap-2">
                <div className="flex text-amber-300">
                  {[...Array(5)].map((_, index) => (
                    <Star key={`star-${index}`} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-white/80">Premium Service</span>
              </div>

              <h1 className="text-[72px] md:text-[96px] font-semibold text-[rgb(255,255,255)] tracking-tight leading-[0.95]">
                Refine Your
                <br />
                <span className="font-normal italic">Daily Ritual.</span>
              </h1>

              <p className="mt-8 max-w-xl text-xl font-medium leading-relaxed text-white/90">
                Experience a new standard of personal grooming in a space designed for clarity and relaxation.
              </p>

              <div className="mt-12 flex flex-wrap gap-4">
                {featuredService ? (
                  <Modal>
                    <Modal.Open opens={`booking-featured-${featuredService.id}`}>
                      <button className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-stone-900 rounded-full text-[15px] font-bold hover:bg-stone-50 transition-all shadow-2xl">
                        Book Your Session
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
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
                    onClick={() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })}
                    className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-stone-900 rounded-full text-[15px] font-bold hover:bg-stone-50 transition-all shadow-2xl"
                  >
                    Explore Services
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                )}

                <button
                  onClick={goCustomerSignup}
                  className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[15px] font-bold hover:bg-white/20 transition-all"
                >
                  Join Community
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 px-8 py-32 lg:grid-cols-2 lg:px-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <span className="text-xs font-bold uppercase tracking-[0.4em] text-stone-400">The Philosophy</span>
            <h2 className="text-5xl font-semibold leading-tight tracking-tight text-stone-900">
              Crafting excellence with every detail.
            </h2>
            <p className="text-lg font-medium leading-relaxed text-stone-500">{philosophyDescription}</p>
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="space-y-2">
                <span className="text-3xl font-semibold text-stone-900">{Math.max(services.length, 12)}+</span>
                <p className="text-sm font-bold uppercase tracking-widest text-stone-400">Master Specialists</p>
              </div>
              <div className="space-y-2">
                <span className="text-3xl font-semibold text-stone-900">{openedYear}</span>
                <p className="text-sm font-bold uppercase tracking-widest text-stone-400">Established</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-[4/5] overflow-hidden rounded-[64px] shadow-2xl"
          >
            <img
              src={philosophyImage}
              alt={`${business.name} interior`}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </section>

        <section id="services-section" className="bg-stone-50 py-32 px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
              <div className="space-y-4">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-[0.4em]">Our Offerings</span>
                <h2 className="text-5xl font-semibold text-stone-900 tracking-tight">Curated Services</h2>
              </div>
              <p className="text-stone-500 font-medium max-w-sm mb-2">
                All services include a complimentary consultation and premium styling products.
              </p>
            </div>

            {servicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={`service-loading-${index}`}
                    className="h-[420px] animate-pulse rounded-[48px] border border-stone-100 bg-white"
                  />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-[48px] border border-stone-100 bg-white p-12 text-center">
                <p className="text-2xl font-semibold text-stone-900">No active services available right now.</p>
                <p className="mt-2 font-medium text-stone-500">Please check back soon.</p>
              </div>
            ) : (
              <div className={servicesGridClass}>
                {services.map((service, index) => {
                  const servicePrice = Number(service.price);
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-10 rounded-[48px] border border-stone-100 hover:shadow-2xl hover:shadow-stone-900/5 transition-all duration-500 group"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <span className="text-3xl font-semibold text-stone-900">
                          {service.priceDisplayMode ? formatPrice(servicePrice) : "Custom"}
                        </span>
                        <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                          <Clock className="h-5 w-5" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-stone-900 mb-4">{toTitleCase(service.name)}</h3>
                      <p className="text-stone-500 font-medium text-sm leading-relaxed mb-8">
                        {getServiceDescriptionLabel(service)}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-10">
                        <Clock className="h-3 w-3" /> {getServiceDurationLabel(service)}
                      </div>

                      <Modal>
                        <Modal.Open opens={`booking-${service.id}`}>
                          <button className="w-full py-4 bg-stone-50 text-stone-900 rounded-2xl text-[13px] font-bold hover:bg-stone-900 hover:text-white transition-all">
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
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-32 lg:px-16">
          <div className="relative overflow-hidden rounded-[64px] bg-stone-900 p-12 lg:p-24">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10">
              <svg viewBox="0 0 400 400" className="h-full w-full fill-current text-white">
                <path d="M0,400 Q200,300 400,400 L400,0 Q200,100 0,0 Z" />
              </svg>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-20 md:grid-cols-2">
              <div className="space-y-12">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-[0.4em] text-stone-400">Get In Touch</span>
                  <h2 className="text-5xl font-semibold leading-tight tracking-tight text-white">
                    Visit us in the
                    <br />
                    heart of the city.
                  </h2>
                </div>

                <div className="space-y-8">
                  <div className="group flex cursor-pointer items-center gap-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/40 transition-all group-hover:bg-white group-hover:text-stone-900">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">Address</p>
                      <p className="text-lg font-medium text-white">{displayAddress}</p>
                    </div>
                  </div>

                  <div className="group flex cursor-pointer items-center gap-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/40 transition-all group-hover:bg-white group-hover:text-stone-900">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">Phone</p>
                      <p className="text-lg font-medium text-white">{displayPhone}</p>
                    </div>
                  </div>

                  <div className="group flex cursor-pointer items-center gap-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/40 transition-all group-hover:bg-white group-hover:text-stone-900">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">Email</p>
                      <p className="text-lg font-medium text-white">{displayEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[48px] border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
                <div>
                  <h3 className="mb-8 text-2xl font-semibold text-white">Operating Hours</h3>
                  <div className="space-y-4">
                    {operatingHours.map((item) => (
                      <div key={item.day} className="flex items-center justify-between border-b border-white/5 py-4 last:border-0">
                        <span className="text-sm font-bold uppercase tracking-widest text-stone-400">{item.day}</span>
                        <span className="font-medium text-white">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress || business.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-12 inline-flex w-full items-center justify-center rounded-2xl bg-white py-5 text-[15px] font-bold text-stone-900 shadow-xl transition-all hover:bg-stone-100"
                >
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-100 bg-white px-8 py-20 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <span className="mb-4 text-2xl font-bold tracking-tight text-stone-900">{business.name}</span>
            <p className="text-sm font-medium text-stone-400">© 2026 {business.name}. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-10">
            <a href="#" className="text-stone-400 transition-colors hover:text-stone-900">
              <Instagram className="h-6 w-6" />
            </a>
            <a href="#" className="text-stone-400 transition-colors hover:text-stone-900">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="#" className="text-stone-400 transition-colors hover:text-stone-900">
              <Twitter className="h-6 w-6" />
            </a>
          </div>

          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-stone-400">
            <a href="#" className="transition-colors hover:text-stone-900">Privacy</a>
            <a href="#" className="transition-colors hover:text-stone-900">Terms</a>
            <a href="#" className="transition-colors hover:text-stone-900">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
