import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";
import { MotionProvider } from "@/components/shared/motion-provider";

/** Shared site shell: sticky nav, main content, footer. */
export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <div className="min-h-screen bg-white text-ink text-sm">
        <Nav />
        <main>{children}</main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
