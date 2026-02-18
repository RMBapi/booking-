"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  logo,
  footer,
  className,
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const renderItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const active = isActive(item.href);

    return (
      <div key={item.label}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              depth > 0 && "ml-4",
              active
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.icon && (
                <span className="shrink-0 w-5 h-5">{item.icon}</span>
              )}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!collapsed && (
              <svg
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              depth > 0 && "ml-4",
              active
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.icon && (
                <span className="shrink-0 w-5 h-5">{item.icon}</span>
              )}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!collapsed && item.badge && (
              <span className="shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {item.badge}
              </span>
            )}
          </Link>
        )}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && logo}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"}
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
        {items.map((item) => renderItem(item))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          {footer}
        </div>
      )}
    </aside>
  );
};
