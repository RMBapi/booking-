"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/utils";

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-5xl",
} as const;

export type ModalShellSize = keyof typeof sizeClasses;

export const modalCloseButtonClass =
  "inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalShellSize;
  zIndex?: number;
  className?: string;
  panelClassName?: string;
  panelStyle?: React.CSSProperties;
}

export function ModalShell({
  open,
  onClose,
  children,
  size = "lg",
  zIndex = 50,
  className,
  panelClassName,
  panelStyle,
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4",
            className,
          )}
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={panelStyle}
            className={cn(
              "relative bg-surface shadow-2xl shadow-black/10 flex flex-col overflow-hidden",
              "w-full max-w-[100vw] max-h-[92dvh] sm:max-h-[90vh]",
              "rounded-t-2xl sm:rounded-2xl border-t sm:border border-border-subtle",
              "pb-[env(safe-area-inset-bottom,0px)]",
              sizeClasses[size],
              panelClassName,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface ModalHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function ModalHeader({
  title,
  eyebrow,
  description,
  onClose,
  children,
  className,
}: ModalHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border-subtle shrink-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
            {eyebrow}
          </p>
        )}
        <h2 className="text-base font-semibold text-text-primary tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
        )}
        {children}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className={modalCloseButtonClass} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-5", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end px-4 sm:px-6 py-4 border-t border-border-subtle bg-subtle/40 gap-3 shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Shared field label style used across modals. */
export const modalFieldLabelClass =
  "block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5";

/** Shared text input style used across modals. */
export const modalInputClass =
  "w-full rounded-lg border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none focus-visible:outline-none";

/** Shared secondary cancel button in modal footers. */
export const modalCancelButtonClass =
  "text-sm font-medium text-text-secondary hover:text-text-primary transition-colors";

/** Shared destructive confirm button in dialogs. */
export const modalDestructiveButtonClass =
  "rounded-lg bg-rose-600 text-white text-sm font-semibold px-4 py-2 hover:bg-rose-700 disabled:opacity-50 w-full sm:w-auto text-center";

/** Shared outline button in dialogs. */
export const modalOutlineButtonClass =
  "rounded-lg border border-border-default text-text-primary text-sm font-semibold px-4 py-2 hover:bg-subtle transition-colors w-full sm:w-auto text-center";
