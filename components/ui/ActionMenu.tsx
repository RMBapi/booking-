"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/utils";
import { IconButton } from "./IconButton";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  /** Native title attribute — useful for explaining why an item is disabled. */
  title?: string;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  align?: "left" | "right";
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  className?: string;
  buttonSize?: "sm" | "md" | "lg";
}

const MENU_GAP = 6;
const MENU_WIDTH = 220;
const VIEWPORT_PADDING = 8;

export function ActionMenu({
  items,
  align = "right",
  triggerLabel = "Actions",
  triggerIcon,
  className,
  buttonSize = "sm",
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the menu relative to the trigger
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const top = rect.bottom + MENU_GAP;
    let left =
      align === "right" ? rect.right - MENU_WIDTH : rect.left;

    // Keep within viewport
    const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
    if (left > maxLeft) left = maxLeft;
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;

    setPos({ top, left });
  }, [open, align]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  // Split into normal + destructive groups
  const normalItems: ActionMenuItem[] = [];
  const dangerItems: ActionMenuItem[] = [];
  for (const item of items) {
    if (item.danger) dangerItems.push(item);
    else normalItems.push(item);
  }

  const menu =
    typeof document !== "undefined" ? (
      <AnimatePresence>
        {open && pos && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: MENU_WIDTH,
            }}
            className={cn(
              "z-[60] rounded-xl bg-surface/95 backdrop-blur-xl",
              "border border-border-subtle shadow-lg shadow-black/10 p-1",
            )}
            role="menu"
          >
            {renderItems(normalItems, () => setOpen(false))}
            {dangerItems.length > 0 && normalItems.length > 0 && (
              <div className="my-1 h-px bg-border-subtle" />
            )}
            {renderItems(dangerItems, () => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    ) : null;

  return (
    <div className={cn("relative inline-block", className)}>
      <IconButton
        ref={triggerRef}
        aria-label={triggerLabel}
        tooltip={triggerLabel}
        size={buttonSize}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
      >
        {triggerIcon ?? <MoreHorizontal />}
      </IconButton>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}

function renderItems(items: ActionMenuItem[], close: () => void) {
  return items.map((item) => {
    if (item.divider) {
      return <div key={item.key} className="my-1 h-px bg-border-subtle" />;
    }
    return (
      <button
        key={item.key}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        title={item.title}
        onClick={() => {
          if (item.disabled) return;
          item.onClick?.();
          close();
        }}
        className={cn(
          "group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
          "focus-visible:outline-none focus-visible:bg-primary-50/70",
          item.disabled && "opacity-40 cursor-not-allowed",
          !item.disabled && (item.danger
            ? "text-rose-600 hover:bg-rose-50/70"
            : "text-text-secondary hover:text-text-primary hover:bg-subtle"),
        )}
      >
        {item.icon && (
          <span
            className={cn(
              "shrink-0 [&_svg]:h-4 [&_svg]:w-4",
              item.danger ? "text-rose-500" : "text-text-tertiary group-hover:text-text-secondary",
            )}
          >
            {item.icon}
          </span>
        )}
        <span className="flex-1 text-left font-medium">{item.label}</span>
        {item.shortcut && (
          <kbd className="text-[10px] font-mono text-text-quaternary tabular">{item.shortcut}</kbd>
        )}
      </button>
    );
  });
}
