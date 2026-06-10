import {
  Sparkles,
  Calendar,
  Users,
  Bell,
  BarChart3,
  Globe,
  LayoutDashboard,
  ArrowRight,
  Clock,
  Layers,
  Unplug,
  CalendarCheck,
  TrendingDown,
  TimerReset,
  TrendingUp,
  Scissors,
  Stethoscope,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Flower2,
  CreditCard,
  Video,
  Mail,
  ShieldCheck,
  Lock,
  DatabaseBackup,
  FileCheck,
} from "lucide-react";
import * as img from "@/assets/images";
import type {
  HeroShot,
  Feature,
  ShowcaseTab,
  CalendarFeature,
  FaqItem,
  ReviewBadge,
  ValueCard,
  JourneyStep,
  Outcome,
  Industry,
  Integration,
  Testimonial,
  PricingTier,
} from "@/types";

/**
 * Hero showcase — four product screenshots arranged around the center logo.
 * Order is the lightbox/carousel navigation order: customer top→bottom, then
 * business top→bottom.
 */
export const HERO_SHOTS: HeroShot[] = [
  { src: img.heroShotCustomer1, category: "customer", categoryLabel: "CUSTOMER EXPERIENCE", title: "Browse & book services", actionHint: "View Full Experience", corner: "tl" },
  { src: img.heroShotCustomer2, category: "customer", categoryLabel: "CUSTOMER EXPERIENCE", title: "Confirm in seconds", actionHint: "View Full Experience", corner: "bl" },
  { src: img.heroShotBusiness1, category: "business", categoryLabel: "BUSINESS MANAGEMENT (CRM)", title: "Manage your business", actionHint: "Explore CRM", corner: "tr" },
  { src: img.heroShotBusiness2, category: "business", categoryLabel: "BUSINESS MANAGEMENT (CRM)", title: "Track every booking", actionHint: "Explore CRM", corner: "br" },
];

export const FEATURES: Feature[] = [
  { icon: Sparkles, title: "Your Brand, Your Identity", desc: "Customize everything to deeply your business and values", color: "text-brand-blue", bgColor: "bg-brand-blue/10" },
  { icon: Calendar, title: "24/7 Online Booking", desc: "Let clients book anytime, anywhere, on any device", color: "text-brand-purple", bgColor: "bg-brand-purple/10" },
  { icon: Users, title: "More Bookings", desc: "Reach more clients and boost your revenue", color: "text-brand-cyan", bgColor: "bg-brand-cyan/10" },
  { icon: Bell, title: "Smart Notifications", desc: "Always updated for bookings, reminders & notes", color: "text-brand-amber", bgColor: "bg-brand-amber/10" },
  { icon: BarChart3, title: "Business Growth", desc: "Powerful tools to manage, analyze and grow", color: "text-brand-pink", bgColor: "bg-brand-pink/10" },
];

export const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    key: "website",
    label: "Website Builder",
    icon: Globe,
    title: "Publish a booking website without writing a line of code.",
    desc: "Drag, drop, and ship a fully branded site with your services, photos, and prices.",
    bullets: ["Custom domains & branding", "Upload photos and videos", "Mobile-first templates"],
    image: img.showcaseWebsiteBuilder,
  },
  {
    key: "crm",
    label: "CRM Dashboard",
    icon: LayoutDashboard,
    title: "One dashboard for everything that runs your business.",
    desc: "Today's bookings, active services, new customers and revenue — all in one place.",
    bullets: ["Live activity & customer pipeline", "Granular permissions", "Built-in reviews"],
    image: img.showcaseCrmDashboard,
  },
];

export const CALENDAR_IMAGES = {
  showcase: img.calendarShowcase,
  weekly: img.calendarWeekly,
  daily: img.calendarDaily,
  monthly: img.calendarMonthly,
} as const;

export const CALENDAR_FEATURES: CalendarFeature[] = [
  { icon: Calendar, title: "Daily, weekly & monthly", desc: "Switch views instantly.", color: "text-brand-blue" },
  { icon: ArrowRight, title: "Drag & drop bookings", desc: "Reschedule in one motion.", color: "text-brand-purple" },
  { icon: Clock, title: "Status filters", desc: "Find anything in seconds.", color: "text-brand-cyan" },
  { icon: Users, title: "Provider schedules", desc: "All staff in one timeline.", color: "text-brand-pink" },
];

export const REVENUE_DATA = [
  { m: "Jan", r: 18 },
  { m: "Feb", r: 24 },
  { m: "Mar", r: 31 },
  { m: "Apr", r: 38 },
  { m: "May", r: 49 },
  { m: "Jun", r: 58 },
  { m: "Jul", r: 71 },
  { m: "Aug", r: 86 },
];

export const BOOKINGS_DATA = [
  { d: "Mon", v: 24 },
  { d: "Tue", v: 32 },
  { d: "Wed", v: 28 },
  { d: "Thu", v: 41 },
  { d: "Fri", v: 56 },
  { d: "Sat", v: 64 },
  { d: "Sun", v: 38 },
];

export const FAQ_ITEMS: FaqItem[] = [
  { q: "How quickly can I get my booking website live?", a: "Most operators publish in under an hour. Pick a template, upload your photos, list your services, and you're ready." },
  { q: "Can I use my own domain and branding?", a: "Yes. Colors, typography, photography, copy, domain — everything is yours. No 'powered by' badges on any paid plan." },
  { q: "Do my clients need to create an account to book?", a: "No. Customers book online in seconds with no account required. They just pick a service, a time, and confirm." },
  { q: "How do payments and reminders work?", a: "Take deposits or full payment at booking via Stripe or PayPal, and we send automatic SMS and email reminders to cut no-shows." },
  { q: "Can I import my existing clients?", a: "Yes. Bring your customer list in by CSV and it lands straight in your CRM with booking history attached as it builds." },
  { q: "Can I invite my team and control their access?", a: "Yes. Add unlimited staff on Business and above, with granular roles and per-provider schedules." },
];

/* === 02 · Social-proof strip ====================================== */
export const PROOF_STAT = { value: "10k+", label: "businesses run on BookBites" } as const;

export const REVIEW_BADGES: ReviewBadge[] = [
  { name: "Trustpilot", rating: 4.8 },
  { name: "Capterra", rating: 4.9 },
  { name: "G2", rating: 4.7 },
];

/* === 03 · Problem → all-in-one value prop ========================= */
export const VALUE_CARDS: ValueCard[] = [
  {
    kind: "Before",
    icon: Unplug,
    title: "Five disconnected tools",
    points: ["A site builder you rent", "A separate scheduler", "A CRM that doesn't talk to either"],
  },
  {
    kind: "After",
    icon: Layers,
    title: "One platform",
    points: ["Website, booking & CRM together", "One login, one subscription", "Every booking in one calendar"],
    highlight: true,
  },
  {
    kind: "Result",
    icon: TrendingUp,
    title: "Less admin, more bookings",
    points: ["Hours back every week", "Fewer no-shows", "More revenue you can see"],
  },
];

/* === 04 · Core feature journey (4 steps) ========================== */
export const JOURNEY_STEPS: JourneyStep[] = [
  {
    num: "01",
    kicker: "Create",
    title: "Build your branded website",
    desc: "Drag, drop, and publish a fully branded booking site — your services, photos and prices, no code required.",
    chips: ["Custom domain", "Mobile-first templates", "Your branding"],
    cta: "Explore templates",
    image: img.showcaseWebsiteBuilder,
    imageSide: "right",
  },
  {
    num: "02",
    kicker: "Set up your services",
    title: "Model your real operation — every service, every provider, every rule",
    desc: "Where lightweight tools struggle: multiple services, staff and calendars. Set per-service schedules, assign providers and add the booking rules your business actually runs on.",
    chips: ["Per-service schedules", "Assign staff & providers", "Custom booking fields", "Buffers & rules", "Multi-location"],
    image: img.onePlatform,
    imageSide: "left",
  },
  {
    num: "03",
    kicker: "Get booked 24/7",
    title: "Customers self-book online, day or night",
    desc: "Pick a service, choose a provider and time, pay at booking. Automatic reminders cut no-shows, and clients reschedule or cancel themselves.",
    chips: ["Pay at booking", "Automatic reminders", "Self-serve reschedule"],
    image: img.heroShotCustomer1,
    imageSide: "right",
  },
  {
    num: "04",
    kicker: "Manage in your CRM",
    title: "Run the whole business from one calendar",
    desc: "Every booking — self-served or added by your team — lands in one dashboard with client profiles, history and workflows.",
    chips: ["Unified calendar", "Client profiles", "Team permissions"],
    cta: "Explore the CRM",
    image: img.showcaseCrmDashboard,
    imageSide: "left",
  },
];

/* === 05 · Quantified outcomes ===================================== */
export const OUTCOMES: Outcome[] = [
  { value: "−75%", label: "fewer no-shows with automatic reminders", icon: TrendingDown },
  { value: "8 hrs", label: "admin saved per week, on average", icon: TimerReset },
  { value: "+30%", label: "more bookings in the first 30 days", icon: CalendarCheck },
];

/* === 06 · Built for your industry ================================= */
export const INDUSTRIES: Industry[] = [
  { name: "Salons", icon: Scissors, color: "text-brand-pink", bgColor: "bg-brand-pink/10" },
  { name: "Clinics", icon: Stethoscope, color: "text-brand-blue", bgColor: "bg-brand-blue/10" },
  { name: "Fitness", icon: Dumbbell, color: "text-brand-cyan", bgColor: "bg-brand-cyan/10" },
  { name: "Tutors", icon: GraduationCap, color: "text-brand-amber", bgColor: "bg-brand-amber/10" },
  { name: "Consultants", icon: Briefcase, color: "text-brand-purple", bgColor: "bg-brand-purple/10" },
  { name: "Spas", icon: Flower2, color: "text-brand-violet", bgColor: "bg-brand-violet/10" },
];

/* === 07 · Integrations ============================================ */
export const INTEGRATIONS: Integration[] = [
  { name: "Google Calendar", icon: Calendar },
  { name: "Stripe", icon: CreditCard },
  { name: "Zoom", icon: Video },
  { name: "Outlook", icon: Mail },
  { name: "PayPal", icon: CreditCard },
  { name: "& more", icon: Sparkles },
];

/* === 08 · Testimonials ============================================ */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "We replaced a website builder, a scheduler and a spreadsheet with BookBites. My admin time dropped in half and the calendar finally makes sense.",
    name: "Priya Nair",
    role: "Owner · Lumière Salon",
    initials: "PN",
  },
  {
    quote: "Per-provider schedules and booking rules just work for a busy clinic. No-shows are down and the front desk isn't drowning in phone calls.",
    name: "Daniel Okafor",
    role: "Manager · Northside Clinic",
    initials: "DO",
  },
  {
    quote: "Clients book themselves at 11pm and pay up front. I show up to a full calendar instead of chasing people for confirmations.",
    name: "Mara Lindqvist",
    role: "Coach · Studio Mara",
    initials: "ML",
  },
];

/* === 09 · Trust & data security =================================== */
export const SECURITY_BADGES = ["SSL encryption", "GDPR-ready", "Daily backups", "Role-based access"] as const;

export const SECURITY_POINTS: Outcome[] = [
  { value: "", label: "Encrypted in transit and at rest", icon: Lock },
  { value: "", label: "GDPR-ready data handling", icon: ShieldCheck },
  { value: "", label: "Automatic daily backups", icon: DatabaseBackup },
  { value: "", label: "Granular team permissions", icon: FileCheck },
];

/* === 10 · Pricing teaser ========================================== */
export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$0",
    cadence: "free forever",
    blurb: "Get a booking site live and take your first bookings.",
    features: ["Booking website", "Online scheduling", "Email reminders"],
    cta: "Get started",
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    blurb: "Everything a growing service business needs to run from one place.",
    features: ["Custom domain & branding", "Payments & SMS reminders", "Full CRM dashboard", "Up to 5 staff"],
    cta: "Start free",
    popular: true,
  },
  {
    name: "Teams",
    price: "Custom",
    cadence: "let's talk",
    blurb: "Multi-location operations with advanced roles and support.",
    features: ["Unlimited staff & locations", "Advanced permissions", "Priority onboarding"],
    cta: "Contact sales",
  },
];

/* === 12 · Final CTA =============================================== */
export const FINAL_CTA = {
  heading: "Your website, booking engine and CRM. One subscription.",
  cta: "Start free — no card needed",
  reassurance: ["14-day free trial", "Cancel anytime"],
} as const;
