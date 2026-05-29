"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck2, Sparkles, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Title of the right-side branded panel (desktop) and mobile header. */
  panelTitle?: string;
  panelSubtitle?: string;
  panelHighlights?: Array<{ icon: React.ReactNode; title: string; description: string }>;
}

const DEFAULT_HIGHLIGHTS = [
  {
    icon: <CalendarCheck2 className="h-5 w-5" />,
    title: "Bookings, simplified",
    description: "One inbox for every appointment, contact, and reminder.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Secure by default",
    description: "Granular permissions per teammate, audited at every request.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Set up in minutes",
    description: "Sane defaults out of the box — customise anything later.",
  },
];

/**
 * Split-screen auth scaffold:
 *   - lg+: form on the left, branded gradient panel on the right
 *   - <lg: single column, slim branded header above the form
 */
export function AuthLayout({
  children,
  panelTitle = "Run your booking business with calm.",
  panelSubtitle = "A clean home for every appointment, every customer, every teammate.",
  panelHighlights = DEFAULT_HIGHLIGHTS,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2">
      {/* Mobile header (visible <lg) */}
      <header className="lg:hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <CalendarCheck2 className="h-4 w-4" />
          </span>
          Booking CRM
        </Link>
      </header>

      {/* Form column */}
      <main className="flex-1 flex flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Link
          href="/"
          className="hidden lg:inline-flex items-center gap-2 font-semibold text-gray-900"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <CalendarCheck2 className="h-4 w-4" />
          </span>
          Booking CRM
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-8 lg:py-0"
        >
          {children}
        </motion.div>
      </main>

      {/* Branded panel (visible lg+) */}
      <aside className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0, transparent 50%)",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="max-w-md">
            <h2 className="text-3xl xl:text-4xl font-bold tracking-tight">
              {panelTitle}
            </h2>
            <p className="mt-4 text-primary-100 leading-relaxed">
              {panelSubtitle}
            </p>
          </div>

          <ul className="space-y-5 max-w-md">
            {panelHighlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur shrink-0">
                  {h.icon}
                </span>
                <div>
                  <p className="font-semibold">{h.title}</p>
                  <p className="text-sm text-primary-100/90">{h.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-xs text-primary-100/70">
            © {new Date().getFullYear()} Booking CRM. All rights reserved.
          </p>
        </div>
      </aside>
    </div>
  );
}
