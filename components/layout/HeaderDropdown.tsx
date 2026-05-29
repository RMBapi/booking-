"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils";

const MENU_GAP = 8;
const VIEWPORT_PADDING = 8;

interface HeaderDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "left" | "right";
  width: number;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function HeaderDropdown({
  open,
  onOpenChange,
  align = "right",
  width,
  trigger,
  children,
  className,
}: HeaderDropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPos(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const top = rect.bottom + MENU_GAP;
      let left = align === "right" ? rect.right - width : rect.left;

      const maxLeft = window.innerWidth - width - VIEWPORT_PADDING;
      if (left > maxLeft) left = maxLeft;
      if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;

      setPos({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    const onScroll = () => onOpenChange(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onOpenChange]);

  const portal =
    typeof document !== "undefined" ? (
      <AnimatePresence>
        {open && pos && (
          <>
            <motion.div
              key="header-dropdown-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="fixed inset-0 z-[60]"
              aria-hidden
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              ref={menuRef}
              key="header-dropdown-menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width,
              }}
              className={cn(
                "z-[70] rounded-xl border border-border-subtle bg-surface shadow-xl shadow-black/10 overflow-hidden",
                className,
              )}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    ) : null;

  return (
    <>
      <div ref={triggerRef} className="relative">
        {trigger}
      </div>
      {portal ? createPortal(portal, document.body) : null}
    </>
  );
}
