"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
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

  if (!isOpen) return null;

  const alignmentStyles = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[200px] rounded-xl bg-white dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "shadow-xl shadow-gray-900/10 dark:shadow-black/30",
        "py-1",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        alignmentStyles[align],
        className
      )}
    >
      {children}
    </div>
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
}

function DropdownItem({ children, onClick, className, icon, danger, disabled }: ItemProps) {
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
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
        "transition-colors duration-150",
        danger
          ? "text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// Divider component
function DropdownDivider() {
  return <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />;
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
        "px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
        className
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
