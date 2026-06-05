import { cn } from "@/lib/utils";

/** Page section wrapper: centered max-width container with consistent padding. */
export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  /** Overrides/extends the inner container's default `py-24` spacing. */
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={className}>
      <div className={cn("max-w-6xl mx-auto px-6 py-14 lg:py-16", containerClassName)}>
        {children}
      </div>
    </section>
  );
}
