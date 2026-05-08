"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/utils";

interface DropdownContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

// Main Dropdown component
interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close }}>
      <div ref={dropdownRef} className={cn("relative inline-block", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// Trigger component
interface TriggerProps {
  children: React.ReactNode;
  className?: string;
}

function DropdownTrigger({ children, className }: TriggerProps) {
  const { toggle } = useContext(DropdownContext);

  return (
    <div onClick={toggle} className={className}>
      {children}
    </div>
  );
}

// Menu component
interface MenuProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}

function DropdownMenu({ children, className, align = "left" }: MenuProps) {
  const { isOpen } = useContext(DropdownContext);

  const alignmentStyles = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "absolute z-50 mt-1.5 min-w-[200px] rounded-xl bg-surface/95 backdrop-blur-xl",
            "border border-border-subtle shadow-lg shadow-black/5 p-1",
            alignmentStyles[align],
            className,
          )}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Item component
interface ItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
  shortcut?: string;
}

function DropdownItem({
  children,
  onClick,
  className,
  icon,
  danger,
  disabled,
  selected,
  shortcut,
}: ItemProps) {
  const { close } = useContext(DropdownContext);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      close();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      role="menuitem"
      className={cn(
        "group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left",
        "transition-colors duration-150 focus-visible:outline-none focus-visible:bg-primary-50/70",
        danger
          ? "text-rose-600 hover:bg-rose-50/70"
          : "text-text-secondary hover:text-text-primary hover:bg-subtle",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "shrink-0 [&_svg]:h-4 [&_svg]:w-4",
            danger ? "text-rose-500" : "text-text-tertiary group-hover:text-text-secondary",
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 font-medium">{children}</span>
      {shortcut && (
        <kbd className="text-[10px] font-mono text-text-quaternary tabular">{shortcut}</kbd>
      )}
      {selected && <Check className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
    </button>
  );
}

// Divider component
function DropdownDivider() {
  return <div className="my-1 h-px bg-border-subtle" />;
}

// Label component
interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

function DropdownLabel({ children, className }: LabelProps) {
  return (
    <div
      className={cn(
        "px-2.5 pt-2 pb-1 text-[10px] font-semibold text-text-quaternary uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </div>
  );
}

// Attach sub-components
Dropdown.Trigger = DropdownTrigger;
Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;
Dropdown.Label = DropdownLabel;

export { Dropdown };
