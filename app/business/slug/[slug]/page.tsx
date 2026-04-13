"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  Star,
  User as UserIcon,
  X,
} from "lucide-react";
import { getBusinessBySlug, getPublicServicesByBusinessSlug } from "@/services";
import { Business, Service, User } from "@/types";
import { Modal, BookingForm, PageLoader } from "@/components";
import { useRoleAuth } from "@/contexts";
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from "framer-motion";
import { BRAND } from "@/lib/publicBrand";

const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: EASE_OUT_QUART },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_QUART },
  },
};

const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_QUART },
  },
};

const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_QUART },
  },
};

const VP = { once: true, amount: 0.2 as const };

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1723101917533-4fc9149c3684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=2000";

const SERVICE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1606333259737-6da197890fa2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1543697506-6729425f7265?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1604368640692-027f44ffb8cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
];

const MOCK_REVIEWS = [
  {
    name: "James T.",
    rating: 5,
    text: "Best experience! The team always deliver a sharp clean result. My go-to place.",
    date: "2 weeks ago",
  },
  {
    name: "Marcus W.",
    rating: 5,
    text: "Absolutely immaculate work. Super professional, relaxed atmosphere. Highly recommend.",
    date: "1 month ago",
  },
  {
    name: "Daniel K.",
    rating: 5,
    text: "Went in feeling unsure and left feeling like a new person. A must-try experience. 10/10.",
    date: "1 month ago",
  },
];

const formatPrice = (price: number) => {
  if (Number.isNaN(price)) return "$0.00";
  return `$${price.toFixed(2)}`;
};

const getServiceDuration = (service: Service) => {
  const s = service as Service & {
    durationMinutes?: number;
    duration?: number;
    durationInMinutes?: number;
  };
  const dur = s.durationMinutes ?? s.duration ?? s.durationInMinutes;
  if (typeof dur === "number" && Number.isFinite(dur) && dur > 0) {
    return `${Math.round(dur)} min`;
  }
  return "Flexible";
};

const titleCase = (v: string) =>
  v
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const serviceDescription = (service: Service) => {
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
  const [customerUser, setCustomerUser] = useState<User | null>(null);

  const [activeSection, setActiveSection] = useState<"home" | "reviews" | "bookings">("home");
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const customerSession = getSession("Customer");
  const customerToken = customerSession.token;
  const sessionUser = customerSession.user;

  const customerIdentifier = useMemo(() => {
    return sessionUser ? `${sessionUser.id}-${sessionUser.email}` : null;
  }, [sessionUser?.id, sessionUser?.email]);

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
  }, [authLoading, customerToken, customerIdentifier, slug]);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const data = await getBusinessBySlug(slug);
        if (data.success) setBusiness(data.data);
        else setError("Business not found");
      } catch {
        setError("Failed to load business");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBusiness();
  }, [slug]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!slug || !business) {
        setServicesLoading(false);
        return;
      }
      try {
        const data = await getPublicServicesByBusinessSlug(slug);
        if (data.success && Array.isArray(data.data)) {
          setServices(
            data.data.filter(
              (s: Service) => s.status === "Active" && s.isActive === true
            )
          );
        } else {
          setServices([]);
        }
      } catch {
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };
    if (slug && business) fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, business?.id]);

  const scrollToSection = (section: "home" | "reviews" | "bookings") => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) return <PageLoader />;

  if (error || !business) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: BRAND.dark }}
      >
        <div
          className="text-center py-12 px-8 max-w-md rounded-lg"
          style={{ backgroundColor: BRAND.card }}
        >
          <h1 className="text-3xl font-bold text-white mb-4">Business Not Found</h1>
          <p className="mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            {error || "The business you are looking for does not exist."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded text-white text-sm font-bold uppercase tracking-widest"
            style={{ backgroundColor: BRAND.cta }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const heroImage = business.image || business.logo || HERO_FALLBACK;
  const displayAddress = business.address || "Address not available";
  const displayPhone = business.phone || "Phone not available";
  const displayEmail = business.email || "Email not available";
  const returnUrl = `/business/slug/${slug}`;

  const goCustomerLogin = () => {
    router.push(
      `/auth/login?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`
    );
  };
  const goCustomerSignup = () => {
    router.push(
      `/auth/register?businessSiteSlug=${encodeURIComponent(slug)}&returnUrl=${encodeURIComponent(returnUrl)}`
    );
  };

  const operatingHours = [
    { day: "Monday", hours: "9:00 AM – 6:00 PM" },
    { day: "Tuesday", hours: "9:00 AM – 6:00 PM" },
    { day: "Wednesday", hours: "9:00 AM – 6:00 PM" },
    { day: "Thursday", hours: "9:00 AM – 7:00 PM" },
    { day: "Friday", hours: "9:00 AM – 7:00 PM" },
    { day: "Saturday", hours: "8:00 AM – 5:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ];

  const featuredService = services[0];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BRAND.dark }}>
      {/* ─── NAVIGATION ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-16"
        style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest mr-4 transition-colors"
            style={{ color: "#888" }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <span
            className="font-black text-lg uppercase tracking-[0.12em]"
            style={{ color: BRAND.dark, letterSpacing: "0.1em" }}
          >
            {business.name}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {(["home", "reviews", "bookings"] as const).map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className="text-sm font-bold uppercase tracking-widest transition-colors relative pb-1"
              style={{ color: activeSection === section ? BRAND.dark : "#888" }}
            >
              {section === "bookings"
                ? "Contact"
                : section.charAt(0).toUpperCase() + section.slice(1)}
              {activeSection === section && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: BRAND.accent }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {authValidated && isCustomerForThisSite && customerUser ? (
            <>
              <span
                className="hidden md:block text-xs font-semibold"
                style={{ color: BRAND.dark }}
              >
                {customerUser.firstName} {customerUser.lastName}
              </span>
              <button
                onClick={() => {
                  logoutRole("Customer");
                  window.location.reload();
                }}
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all"
                style={{ borderColor: BRAND.dark, color: BRAND.dark }}
                title="Logout"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={goCustomerLogin}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all"
              style={{ borderColor: BRAND.dark, color: BRAND.dark }}
              title="Login"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}

          {featuredService ? (
            <Modal>
              <Modal.Open opens="nav-book-now">
                <button
                  className="px-5 py-2 rounded text-white text-sm font-bold uppercase tracking-widest transition-all hidden md:block"
                  style={{ backgroundColor: BRAND.cta }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.ctaHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.cta)}
                >
                  Book Now
                </button>
              </Modal.Open>
              <Modal.Body name="nav-book-now" size="full" className="w-full max-w-6xl p-0">
                <BookingForm
                  service={featuredService}
                  businessSlug={slug}
                  businessId={business.id}
                  heroImageUrl={heroImage}
                  businessName={business.name}
                  onClose={() => {}}
                  variant="dark"
                />
              </Modal.Body>
            </Modal>
          ) : (
            <button
              className="px-5 py-2 rounded text-white text-sm font-bold uppercase tracking-widest transition-all hidden md:block"
              style={{ backgroundColor: BRAND.cta }}
              onClick={() =>
                document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Book Now
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: BRAND.dark }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
          className="fixed top-16 left-0 right-0 z-40 flex flex-col gap-1 px-6 py-4 shadow-xl"
          style={{ backgroundColor: "white" }}
        >
          {(["home", "reviews", "bookings"] as const).map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className="text-left py-3 text-sm font-bold uppercase tracking-widest border-b last:border-0"
              style={{ color: BRAND.dark, borderColor: "#eee" }}
            >
              {section === "bookings"
                ? "Contact"
                : section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
          {authValidated && isCustomerForThisSite && customerUser ? (
            <button
              onClick={() => {
                logoutRole("Customer");
                window.location.reload();
              }}
              className="mt-3 py-3 rounded text-white text-sm font-bold uppercase tracking-widest"
              style={{ backgroundColor: BRAND.card }}
            >
              Logout ({customerUser.firstName})
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  goCustomerLogin();
                  setMobileMenuOpen(false);
                }}
                className="mt-3 py-3 rounded text-sm font-bold uppercase tracking-widest border"
                style={{ color: BRAND.dark, borderColor: BRAND.dark }}
              >
                Login
              </button>
              <button
                onClick={() => {
                  goCustomerSignup();
                  setMobileMenuOpen(false);
                }}
                className="mt-2 py-3 rounded text-white text-sm font-bold uppercase tracking-widest"
                style={{ backgroundColor: BRAND.cta }}
              >
                Join Now
              </button>
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <main className="pt-16">
        {/* ─── HERO ─── */}
        <HeroSection
          business={business}
          heroImage={heroImage}
          displayAddress={displayAddress}
          featuredService={featuredService}
          slug={slug}
        />

        {/* ─── BOOKING STEP BAR ─── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="w-full border-b"
          style={{ backgroundColor: BRAND.card, borderColor: "rgba(255,255,255,0.08)" }}
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="max-w-5xl mx-auto flex items-center"
          >
            {["SERVICES", "PROVIDER", "TIME", "CLIENT"].map((step, i) => (
              <motion.div
                key={step}
                variants={fadeUp}
                custom={i}
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
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    |
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ─── SERVICES GRID ─── */}
        <section
          id="services-section"
          className="py-16 px-6 lg:px-16"
          style={{ backgroundColor: BRAND.dark }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="flex justify-end mb-8"
            >
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {services.length} service{services.length !== 1 ? "s" : ""} available
              </span>
            </motion.div>

            {servicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={`skel-${i}`}
                    className="h-[420px] animate-pulse rounded"
                    style={{ backgroundColor: BRAND.card }}
                  />
                ))}
              </div>
            ) : services.length === 0 ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VP}
                className="rounded p-12 text-center"
                style={{ backgroundColor: BRAND.card }}
              >
                <p className="text-xl font-bold text-white">
                  No active services available right now.
                </p>
                <p className="mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Please check back soon.
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={VP}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {services.map((service, idx) => {
                  const price = Number(service.price);
                  const desc = serviceDescription(service);
                  const fallbackImg =
                    SERVICE_FALLBACK_IMAGES[idx % SERVICE_FALLBACK_IMAGES.length];
                  const serviceImg =
                    (service as Service & { imageUrl?: string }).imageUrl || fallbackImg;

                  return (
                    <motion.div
                      key={service.id}
                      variants={scaleUp}
                      className="flex flex-col rounded overflow-hidden"
                      style={{ backgroundColor: BRAND.card }}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={serviceImg}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>

                      <div className="flex flex-col flex-1 p-5">
                        <h3 className="font-bold text-white mb-2" style={{ fontSize: "1rem" }}>
                          {titleCase(service.name)}
                        </h3>
                        <p
                          className="text-sm leading-relaxed mb-1"
                          style={{ color: "rgba(255,255,255,0.55)" }}
                        >
                          {expandedService === service.id
                            ? desc
                            : desc.length > 90
                              ? desc.slice(0, 90) + "..."
                              : desc}
                        </p>
                        {desc.length > 90 && (
                          <button
                            onClick={() =>
                              setExpandedService(
                                expandedService === service.id ? null : service.id
                              )
                            }
                            className="text-xs font-bold text-left mb-3 transition-colors"
                            style={{ color: BRAND.accent }}
                          >
                            {expandedService === service.id ? "Read less" : "Read more"}
                          </button>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-3 mb-4">
                          <span
                            className="text-sm"
                            style={{ color: "rgba(255,255,255,0.55)" }}
                          >
                            {getServiceDuration(service)}
                          </span>
                          <span className="font-bold text-white">
                            {service.priceDisplayMode ? formatPrice(price) : "Custom"}
                          </span>
                        </div>

                        <Modal>
                          <Modal.Open opens={`booking-${service.id}`}>
                            <button
                              className="w-full py-3 rounded text-sm font-bold uppercase tracking-widest border transition-all"
                              style={{
                                borderColor: "rgba(255,255,255,0.4)",
                                color: "white",
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "white";
                                e.currentTarget.style.color = BRAND.dark;
                                e.currentTarget.style.borderColor = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "white";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                              }}
                            >
                              Select
                            </button>
                          </Modal.Open>
                          <Modal.Body
                            name={`booking-${service.id}`}
                            size="full"
                            className="w-full max-w-6xl p-0"
                          >
                            <BookingForm
                              service={service}
                              businessSlug={slug}
                              businessId={business.id}
                              heroImageUrl={heroImage}
                              businessName={business.name}
                              onClose={() => {}}
                              variant="dark"
                            />
                          </Modal.Body>
                        </Modal>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </section>

        {/* ─── REVIEWS ─── */}
        <section
          id="reviews"
          className="py-20 px-6 lg:px-16"
          style={{ backgroundColor: BRAND.darker }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="mb-12"
            >
              <motion.p
                variants={fadeUp}
                custom={0}
                className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                style={{ color: BRAND.accent }}
              >
                Client Reviews
              </motion.p>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-black uppercase text-white"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "0.05em",
                }}
              >
                WHAT THEY SAY
              </motion.h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {MOCK_REVIEWS.map((review) => (
                <motion.div
                  key={review.name}
                  variants={scaleUp}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="p-8 rounded"
                  style={{ backgroundColor: BRAND.card }}
                >
                  <div className="flex mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current"
                        style={{ color: BRAND.accent }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-6"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{review.name}</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {review.date}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── CONTACT / INFO ─── */}
        <section
          id="bookings"
          className="py-20 px-6 lg:px-16"
          style={{ backgroundColor: BRAND.dark }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div
                variants={slideFromLeft}
                initial="hidden"
                whileInView="visible"
                viewport={VP}
                className="space-y-10"
              >
                <div>
                  <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={VP}
                    className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                    style={{ color: BRAND.accent }}
                  >
                    Find Us
                  </motion.p>
                  <motion.h2
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    custom={1}
                    viewport={VP}
                    className="font-black uppercase text-white"
                    style={{
                      fontSize: "clamp(1.8rem, 4vw, 3rem)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    VISIT THE SHOP
                  </motion.h2>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VP}
                  className="space-y-6"
                >
                  {[
                    { icon: MapPin, label: "Address", value: displayAddress },
                    { icon: Phone, label: "Phone", value: displayPhone },
                    { icon: Mail, label: "Email", value: displayEmail },
                  ].map(({ icon: Icon, label, value }) => (
                    <motion.div
                      key={label}
                      variants={fadeUp}
                      className="flex items-center gap-5 group cursor-pointer"
                    >
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ backgroundColor: BRAND.card }}
                      >
                        <Icon className="w-5 h-5" style={{ color: BRAND.accent }} />
                      </div>
                      <div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          {label}
                        </p>
                        <p className="text-white font-medium text-sm">{value}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  custom={2}
                  viewport={VP}
                >
                  {featuredService ? (
                    <Modal>
                      <Modal.Open opens="contact-book-now">
                        <button
                          className="flex items-center gap-3 px-8 py-4 rounded text-white font-bold text-sm uppercase tracking-widest transition-all"
                          style={{ backgroundColor: BRAND.cta }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = BRAND.ctaHover)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = BRAND.cta)
                          }
                        >
                          Book Your Appointment
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Modal.Open>
                      <Modal.Body
                        name="contact-book-now"
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
                          variant="dark"
                        />
                      </Modal.Body>
                    </Modal>
                  ) : (
                    <button
                      className="flex items-center gap-3 px-8 py-4 rounded text-white font-bold text-sm uppercase tracking-widest transition-all"
                      style={{ backgroundColor: BRAND.cta }}
                      onClick={() =>
                        document
                          .getElementById("services-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      Browse Services
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              </motion.div>

              {/* Opening Hours */}
              <motion.div
                variants={slideFromRight}
                initial="hidden"
                whileInView="visible"
                viewport={VP}
                className="rounded p-8"
                style={{ backgroundColor: BRAND.card }}
              >
                <motion.h3
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VP}
                  className="font-black uppercase text-white mb-8 tracking-widest"
                  style={{ fontSize: "1.25rem" }}
                >
                  OPENING HOURS
                </motion.h3>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VP}
                  className="space-y-0"
                >
                  {operatingHours.map((item) => (
                    <motion.div
                      key={item.day}
                      variants={fadeIn}
                      className="flex justify-between items-center py-4 border-b last:border-0"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    >
                      <span
                        className="text-sm font-bold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {item.day}
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: item.hours === "Closed" ? "rgba(255,255,255,0.3)" : "white",
                        }}
                      >
                        {item.hours}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <motion.footer
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
        className="border-t py-10 px-6 lg:px-16"
        style={{ backgroundColor: BRAND.darker, borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span
              className="font-black uppercase tracking-widest text-white"
              style={{ fontSize: "1.1rem", letterSpacing: "0.1em" }}
            >
              {business.name.toUpperCase()}
            </span>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              &copy; {new Date().getFullYear()} {business.name}. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="#"
              className="transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>

          <div
            className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

function HeroSection({
  business,
  heroImage,
  displayAddress,
  featuredService,
  slug,
}: {
  business: Business;
  heroImage: string;
  displayAddress: string;
  featuredService: Service | undefined;
  slug: string;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.45, 0.75]);

  const heroStagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };

  const heroChild: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: EASE_OUT_QUART },
    },
  };

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative h-[90vh] w-full flex items-end pb-20 px-8 lg:px-20 overflow-hidden"
    >
      <motion.div className="absolute inset-0 z-0" style={{ y: imgY }}>
        <img
          src={heroImage}
          alt={`${business.name} hero`}
          className="w-full h-full object-cover"
          style={{ willChange: "transform" }}
        />
      </motion.div>
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to top, ${BRAND.darker}EE 0%, ${BRAND.dark}99 40%, transparent 70%)`,
        }}
      />
      <motion.div
        className="absolute inset-0 z-[1]"
        style={{ backgroundColor: `rgba(44,8,0,1)`, opacity: overlayOpacity }}
      />

      <div className="relative z-10 w-full">
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={heroChild}
            className="font-black uppercase text-white mb-8 leading-none"
            style={{
              fontSize: "clamp(3rem, 8vw, 7rem)",
              letterSpacing: "0.04em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            {business.name.split(" ").map((word, i) => (
              <React.Fragment key={i}>
                {word}
                {i < business.name.split(" ").length - 1 && <br />}
              </React.Fragment>
            ))}
          </motion.h1>

          {business.description && (
            <motion.p
              variants={heroChild}
              className="max-w-xl text-lg font-medium leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {business.description}
            </motion.p>
          )}

          <motion.div variants={heroChild} className="flex flex-wrap gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress || business.name)}`}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3 rounded text-sm font-bold uppercase tracking-widest border-2 transition-all"
              style={{ borderColor: "white", color: "white", backgroundColor: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.color = BRAND.dark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "white";
              }}
            >
              Show on Map
            </a>

            {featuredService ? (
              <Modal>
                <Modal.Open opens="hero-book-now">
                  <button
                    className="px-8 py-3 rounded text-white text-sm font-bold uppercase tracking-widest transition-all"
                    style={{ backgroundColor: BRAND.cta }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = BRAND.ctaHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = BRAND.cta)
                    }
                  >
                    Book Now
                  </button>
                </Modal.Open>
                <Modal.Body
                  name="hero-book-now"
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
                    variant="dark"
                  />
                </Modal.Body>
              </Modal>
            ) : (
              <button
                className="px-8 py-3 rounded text-white text-sm font-bold uppercase tracking-widest transition-all"
                style={{ backgroundColor: BRAND.cta }}
                onClick={() =>
                  document
                    .getElementById("services-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Book Now
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
