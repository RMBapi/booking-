"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  LogOut,
  Mail,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";
import { User } from "@/types";
import { ELEGANZA } from "@/lib/publicBrand";

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onMyBookings: () => void;
  onContacts: () => void;
}

export function UserMenu({
  user,
  onLogout,
  onMyBookings,
  onContacts,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-colors cursor-pointer"
        style={{
          borderColor: ELEGANZA.ink,
          color: ELEGANZA.ink,
          backgroundColor: open ? ELEGANZA.surfaceMuted : "transparent",
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{ backgroundColor: ELEGANZA.ink }}
        >
          {initials || <UserIcon className="w-3.5 h-3.5" />}
        </span>
        <span className="text-xs font-semibold tracking-wide max-w-[120px] truncate">
          {user.firstName || "Account"}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className="absolute right-0 top-[calc(100%+10px)] w-72 rounded overflow-hidden border"
            style={{
              backgroundColor: ELEGANZA.surface,
              borderColor: ELEGANZA.border,
            }}
          >
            <div
              className="px-4 py-4 border-b"
              style={{ borderColor: ELEGANZA.border }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: ELEGANZA.ink }}
                >
                  {initials || <UserIcon className="w-5 h-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: ELEGANZA.ink }}
                  >
                    {displayName || "Account"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: ELEGANZA.inkMuted }}
                    />
                    <p
                      className="text-[11px] truncate"
                      style={{ color: ELEGANZA.inkMuted }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="py-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  onMyBookings();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{ color: ELEGANZA.ink }}
                role="menuitem"
              >
                <Calendar className="w-4 h-4" style={{ color: ELEGANZA.ink }} />
                My Bookings
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onContacts();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{ color: ELEGANZA.ink }}
                role="menuitem"
              >
                <MessageSquare
                  className="w-4 h-4"
                  style={{ color: ELEGANZA.ink }}
                />
                Contact Us
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-red-50"
                style={{ color: "#991B1B" }}
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
