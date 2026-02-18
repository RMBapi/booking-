import React from "react";
import { cn } from "@/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page layout wrapper with max-width and padding
 * Use this for all page content to ensure consistency
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("min-h-screen bg-gray-50 w-full", className)}>
      {children}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header with title, subtitle, and optional actions
 * STRICT: max-w-7xl mx-auto px-6 w-full
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className,
}) => {
  return (
    <header className={cn("bg-white border-b border-border sticky top-0 z-10 shadow-sm w-full", className)}>
      <div className="max-w-7xl mx-auto px-6 py-6 w-full">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {icon && (
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
};

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page content wrapper with max-width and padding
 * STRICT: max-w-7xl mx-auto px-6 w-full py-8
 */
export const PageContent: React.FC<PageContentProps> = ({
  children,
  className,
}) => {
  return (
    <main className={cn("max-w-7xl mx-auto px-6 w-full py-8", className)}>
      {children}
    </main>
  );
};

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Section wrapper for organizing content within a page
 * STRICT: space-y-6, mt-8 separation
 */
export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <section className={cn("space-y-6", className)}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-6 w-full">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state component for when no data is available
 * STRICT: Proper spacing and centering
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center w-full", className)}>
      {icon && (
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 max-w-md mb-8">{description}</p>
      )}
      {action}
    </div>
  );
};
