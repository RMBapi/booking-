import { cn } from "@/lib/utils";

/** Small uppercase label that sits above section headings. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="uppercase tracking-[0.18em] text-subtle text-xs font-medium">
      {children}
    </p>
  );
}

/** Primary section heading (32px / 600). */
export function H2({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn(
        "mt-3 text-ink tracking-tight text-[2rem] leading-[1.15] font-semibold",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Supporting paragraph under a heading. */
export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-subtle text-base leading-[1.6] font-normal">
      {children}
    </p>
  );
}
