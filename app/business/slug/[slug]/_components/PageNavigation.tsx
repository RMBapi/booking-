"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, User as UserIcon, X } from "lucide-react";
import { Business, Service, User } from "@/types";
import { Modal, BookingForm } from "@/components";
import { BRAND, getImageUrl } from "@/lib/publicBrand";
import { EASE_OUT_QUART } from "../_constants";
import { UserMenu } from "./UserMenu";

interface PageNavigationProps {
  business: Business;
  slug: string;
  heroImage: string;
  featuredService: Service | undefined;
  activeSection: "home" | "reviews" | "bookings";
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  scrollToSection: (section: "home" | "reviews" | "bookings") => void;
  authValidated: boolean;
  isCustomerForThisSite: boolean;
  customerUser: User | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
  onMyBookings: () => void;
}

export function PageNavigation({
  business,
  slug,
  heroImage,
  featuredService,
  activeSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  scrollToSection,
  authValidated,
  isCustomerForThisSite,
  customerUser,
  onLogin,
  onSignup,
  onLogout,
  onMyBookings,
}: PageNavigationProps) {
  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-18 md:h-20 lg:h-22 flex items-center justify-between px-6 lg:px-16"
        style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-4 py-2 pr-4 md:pr-8">
          {getImageUrl(business.logo) ? (
            <img
              src={getImageUrl(business.logo)!}
              alt={`${business.name} logo`}
              className="h-[calc(var(--spacing)*21)] w-auto object-contain transition-transform duration-200 hover:scale-105"
            />
          ) : (
            <span
              className="font-extrabold text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.25rem] uppercase tracking-[0.08em] transition-opacity duration-200 hover:opacity-85"
              style={{ color: BRAND.dark }}
            >
              {business.name}
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { key: "home", label: "Home", action: () => scrollToSection("home") },
            { key: "reviews", label: "Reviews", action: () => scrollToSection("reviews") },
            { key: "bookings", label: "Contact", action: () => scrollToSection("bookings") },
          ].map((item) => (
            <button
              key={item.key}
              onClick={item.action}
              className="text-sm font-bold uppercase tracking-widest transition-colors relative pb-1"
              style={{ color: activeSection === item.key ? BRAND.dark : "#888" }}
            >
              {item.label}
              {activeSection === item.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: BRAND.accent }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {featuredService ? (
            <Modal>
              <Modal.Open opens="nav-book-now">
                <button
                  type="button"
                  className="px-5 py-2 rounded text-white text-sm font-bold uppercase tracking-widest transition-all hidden md:block hover:brightness-110"
                  style={{ backgroundColor: BRAND.cta }}
                >
                  Book Now
                </button>
              </Modal.Open>
              <Modal.Body
                name="nav-book-now"
                size="full"
                className="w-full max-w-6xl p-0"
                hideDefaultClose
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
              type="button"
              className="px-5 py-2 rounded text-white text-sm font-bold uppercase tracking-widest transition-all hidden md:block hover:brightness-110"
              style={{ backgroundColor: BRAND.cta }}
              onClick={() =>
                document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Book Now
            </button>
          )}

          {authValidated && isCustomerForThisSite && customerUser ? (
            <UserMenu
              user={customerUser}
              onLogout={onLogout}
              onMyBookings={onMyBookings}
            />
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all hover:shadow-md cursor-pointer"
              style={{ borderColor: BRAND.dark, color: BRAND.dark }}
              title="Login"
              aria-label="Login"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: BRAND.dark }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
            className="fixed top-18 md:top-20 left-0 right-0 z-40 flex flex-col gap-1 px-6 py-4 shadow-xl bg-white"
          >
            {[
              { key: "home", label: "Home", action: () => scrollToSection("home") },
              { key: "reviews", label: "Reviews", action: () => scrollToSection("reviews") },
              { key: "bookings", label: "Contact", action: () => scrollToSection("bookings") },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => { item.action(); setMobileMenuOpen(false); }}
                className="text-left py-3 text-sm font-bold uppercase tracking-widest border-b"
                style={{ color: BRAND.dark, borderColor: "#eee" }}
              >
                {item.label}
              </button>
            ))}
            {authValidated && isCustomerForThisSite && customerUser ? (
              <>
                <div
                  className="mt-3 px-3 py-3 rounded text-xs"
                  style={{ backgroundColor: "#f5f1ec", color: BRAND.dark }}
                >
                  <p className="font-bold truncate">
                    {customerUser.firstName} {customerUser.lastName}
                  </p>
                  <p className="mt-0.5 truncate opacity-70">{customerUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { onMyBookings(); setMobileMenuOpen(false); }}
                  className="mt-2 py-3 rounded text-sm font-bold uppercase tracking-widest border"
                  style={{ color: BRAND.dark, borderColor: BRAND.dark }}
                >
                  My Bookings
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-2 py-3 rounded text-white text-sm font-bold uppercase tracking-widest"
                  style={{ backgroundColor: BRAND.card }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                  className="mt-3 py-3 rounded text-sm font-bold uppercase tracking-widest border"
                  style={{ color: BRAND.dark, borderColor: BRAND.dark }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { onSignup(); setMobileMenuOpen(false); }}
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
    </>
  );
}
