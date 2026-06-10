import Image from "next/image";
import { cn } from "@/utils";

const LOGO_ASPECT_RATIO = 1024 / 294;

type BookbitesLogoSize = "sm" | "md" | "lg";

interface BookbitesLogoProps {
  className?: string;
  /** Render a cropped mark for narrow spaces (e.g. collapsed sidebar). */
  compact?: boolean;
  size?: BookbitesLogoSize;
}

/** Explicit heights — avoids Tailwind v4 max-h-* scale mismatches (e.g. max-h-14 ≠ spacing × 14). */
const SIZE_MAX_HEIGHT: Record<BookbitesLogoSize, string> = {
  sm: "max-h-[2.25rem]",
  md: "max-h-[2.75rem]",
  lg: "max-h-[3rem]",
};

const SIZE_HEIGHT: Record<BookbitesLogoSize, number> = {
  sm: 36,
  md: 44,
  lg: 48,
};

export function BookbitesLogo({
  className,
  compact = false,
  size = "md",
}: BookbitesLogoProps) {
  const height = SIZE_HEIGHT[size];
  const width = Math.round(height * LOGO_ASPECT_RATIO);

  if (compact) {
    return (
      <Image
        src="/bookbites-logo.png"
        alt="bookbites by Cuebites"
        width={width}
        height={height}
        priority
        className={cn(
          "h-10 w-10 shrink-0 object-cover object-left",
          className,
        )}
      />
    );
  }

  return (
    <Image
      src="/bookbites-logo.png"
      alt="bookbites by Cuebites"
      width={width}
      height={height}
      priority
      className={cn(
        "h-auto w-auto shrink-0 object-contain object-center",
        SIZE_MAX_HEIGHT[size],
        className,
      )}
    />
  );
}
