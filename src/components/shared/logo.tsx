import { BRAND } from "@/constants/site";

// The logo is a static SVG wordmark. next/image does not optimize SVGs (it
// serves them as-is) and treating it as an optimized image triggers spurious
// LCP-priority warnings, so a plain <img> is the correct, lightest choice.
// width/height keep the 3001×862 (~3.48:1) ratio so layout space is reserved.
export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt={BRAND.logoAlt}
      width={139}
      height={40}
      className={className}
    />
  );
}
