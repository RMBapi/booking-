"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, User as UserIcon, X } from "lucide-react";
import { Business, Service, User } from "@/types";
import { Modal, BookingForm } from "@/components";
import { ELEGANZA, getImageUrl } from "@/lib/publicBrand";
import { EASE_OUT_QUART } from "@/lib/motion";
import { UserMenu } from "./UserMenu";

interface PageNavigationProps {
  business: Business;
  slug: string;
  heroImage: string;
  featuredService: Service | undefined;
  services?: Service[];
  activeSection: "home" | "bookings" | null;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  scrollToSection: (section: "home" | "bookings") => void;
  authValidated: boolean;
  isCustomerForThisSite: boolean;
  customerUser: User | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
  onMyBookings: () => void;
  onContacts: () => void;
  /** Logo click — defaults to Home navigation. */
  onLogoClick?: () => void;
  /** When set, Home/Contact use route navigation instead of in-page scroll. */
  onNavigateHome?: () => void;
  onNavigateContact?: () => void;
}

export function PageNavigation({
  business,
  slug,
  heroImage,
  featuredService,
  services,
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
  onContacts,
  onLogoClick,
  onNavigateHome,
  onNavigateContact,
}: PageNavigationProps) {
  const goHome = onNavigateHome ?? (() => scrollToSection("home"));
  const goContact = onNavigateContact ?? (() => scrollToSection("bookings"));
  const goLogo = onLogoClick ?? goHome;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-18 md:h-20 lg:h-22 flex items-center justify-between px-6 lg:px-16"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${ELEGANZA.border}`,
        }}
      >
        <div className="flex items-center gap-4 py-2 pr-4 md:pr-8">
          <button
            type="button"
            onClick={goLogo}
            className="flex items-center gap-4 text-left transition-opacity duration-200 hover:opacity-85 cursor-pointer"
            aria-label={`Go to ${business.name} homepage`}
          >
            {getImageUrl(business.logo) ? (
              <Image
                src={getImageUrl(business.logo)!}
                alt={`${business.name} logo`}
                width={160}
                height={84}
                className="h-[calc(var(--spacing)*21)] w-auto object-contain transition-transform duration-200 hover:scale-105"
                style={{ width: "auto", height: "calc(var(--spacing) * 21)" }}
              />
            ) : (
              <span
                className="font-[var(--font-display)] text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.25rem] uppercase tracking-[0.12em]"
                style={{ color: ELEGANZA.ink }}
              >
                {business.name}
              </span>
            )}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            {
              key: "home",
              label: "Home",
              action: goHome,
            },
            {
              key: "bookings",
              label: "Contact",
              action: goContact,
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={item.action}
              className="text-sm font-semibold uppercase tracking-[0.2em] transition-colors relative pb-1"
              style={{
                color:
                  activeSection === item.key ? ELEGANZA.ink : ELEGANZA.inkMuted,
              }}
            >
              {item.label}
              {activeSection === item.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: ELEGANZA.ink }}
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
                  className="px-5 py-2 rounded text-sm font-semibold uppercase tracking-[0.2em] transition-colors hidden md:block"
                  style={{
                    border: `1px solid ${ELEGANZA.ink}`,
                    color: ELEGANZA.ink,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = ELEGANZA.ink;
                    e.currentTarget.style.color = ELEGANZA.surface;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = ELEGANZA.ink;
                  }}
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
                  services={services}
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
              className="px-5 py-2 rounded text-sm font-semibold uppercase tracking-[0.2em] transition-colors hidden md:block"
              style={{
                border: `1px solid ${ELEGANZA.ink}`,
                color: ELEGANZA.ink,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = ELEGANZA.ink;
                e.currentTarget.style.color = ELEGANZA.surface;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = ELEGANZA.ink;
              }}
              onClick={() =>
                document
                  .getElementById("services-section")
                  ?.scrollIntoView({ behavior: "smooth" })
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
              onContacts={onContacts}
            />
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border transition-colors cursor-pointer"
              style={{ borderColor: ELEGANZA.ink, color: ELEGANZA.ink }}
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
            style={{ color: ELEGANZA.ink }}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
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
            className="fixed top-18 md:top-20 left-0 right-0 z-40 flex flex-col gap-1 px-6 py-4"
            style={{
              backgroundColor: ELEGANZA.surface,
              borderBottom: `1px solid ${ELEGANZA.border}`,
            }}
          >
            {[
              {
                key: "home",
                label: "Home",
                action: goHome,
              },
              {
                key: "bookings",
                label: "Contact",
                action: goContact,
              },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className="text-left py-3 text-sm font-semibold uppercase tracking-[0.2em] border-b"
                style={{ color: ELEGANZA.ink, borderColor: ELEGANZA.border }}
              >
                {item.label}
              </button>
            ))}
            {authValidated && isCustomerForThisSite && customerUser ? (
              <>
                <div
                  className="mt-3 px-3 py-3 rounded text-xs"
                  style={{
                    backgroundColor: ELEGANZA.surfaceMuted,
                    color: ELEGANZA.ink,
                  }}
                >
                  <p className="font-bold truncate">
                    {customerUser.firstName} {customerUser.lastName}
                  </p>
                  <p className="mt-0.5 truncate opacity-70">
                    {customerUser.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onMyBookings();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 py-3 rounded text-sm font-semibold uppercase tracking-[0.2em] border"
                  style={{ color: ELEGANZA.ink, borderColor: ELEGANZA.ink }}
                >
                  My Bookings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onContacts();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 py-3 rounded text-sm font-semibold uppercase tracking-[0.2em] border"
                  style={{ color: ELEGANZA.ink, borderColor: ELEGANZA.ink }}
                >
                  Contact Us
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-2 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{ backgroundColor: ELEGANZA.ink }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-3 py-3 rounded text-sm font-semibold uppercase tracking-[0.2em] border"
                  style={{ color: ELEGANZA.ink, borderColor: ELEGANZA.ink }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSignup();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 py-3 rounded text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{
                    backgroundColor: ELEGANZA.surfaceMuted,
                    color: ELEGANZA.ink,
                    border: `1px solid ${ELEGANZA.border}`,
                  }}
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
