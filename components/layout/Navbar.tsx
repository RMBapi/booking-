"use client";

import React from "react";
import { cn } from "@/utils";

interface NavbarProps {
  children?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  sticky?: boolean;
  transparent?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  children,
  leftContent,
  rightContent,
  className,
  sticky = false,
  transparent = false,
}) => {
  return (
    <header
      className={cn(
        "z-40 border-b transition-all duration-200",
        sticky && "sticky top-0",
        transparent
          ? "bg-transparent border-transparent"
          : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-gray-200 dark:border-gray-800",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          {leftContent && (
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {leftContent}
            </div>
          )}

          {/* Center content */}
          {children && (
            <div className="flex items-center justify-center flex-1">
              {children}
            </div>
          )}

          {/* Right section */}
          {rightContent && (
            <div className="flex items-center gap-3 justify-end flex-1">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// User menu component for navbar
interface UserMenuProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    danger?: boolean;
  }>;
}

export const NavbarUserMenu: React.FC<UserMenuProps> = ({ user, menuItems }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user.name}
          </p>
          {user.email && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          )}
        </div>
        <svg
          className={cn(
            "w-4 h-4 text-gray-500 transition-transform duration-200 hidden md:block",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && menuItems && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-900/10 dark:shadow-black/30 py-1 animate-in fade-in-0 zoom-in-95 duration-200">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-150",
                item.danger
                  ? "text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
