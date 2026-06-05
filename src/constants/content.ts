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
} from "lucide-react";
import * as img from "@/assets/images";
import type {
  HeroShot,
  Feature,
  ShowcaseTab,
  CalendarFeature,
  FaqItem,
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
  { q: "Can I customize everything to match my brand?", a: "Yes. Colors, typography, photography, copy, domain — everything is yours. No 'powered by' badges on any paid plan." },
  { q: "How do bookings, payments and reminders work?", a: "Customers book online in seconds. We send automatic SMS and email reminders, take deposits if you want, and sync everything to your dashboard." },
  { q: "Can I invite my team and control their access?", a: "Yes. Add unlimited staff on Business and above, with granular roles and permissions." },
  { q: "Will my analytics actually be useful?", a: "We focus on the metrics that move the needle: revenue, retention, no-show rate, top services and per-provider performance." },
  { q: "What if I need help setting things up?", a: "Every plan includes free onboarding support. Business and Enterprise get a dedicated success manager." },
];
