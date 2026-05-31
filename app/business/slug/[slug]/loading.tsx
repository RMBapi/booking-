import { ELEGANZA } from "@/lib/publicBrand";

/**
 * Route-level loading skeleton for the public business page.
 *
 * Shown only while the page streams its server-fetched data (~a few hundred ms).
 * It deliberately mirrors the real layout — fixed nav bar + full-height dark
 * hero with text/button placeholders — on the exact page background, so when
 * the real content arrives the swap is seamless. This replaces the branded GIF
 * loader, which flashed jarringly for a few milliseconds on first load.
 */
export default function BusinessPageLoading() {
  const block = "rounded-md animate-pulse";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: ELEGANZA.background,
        backgroundImage:
          "radial-gradient(circle at 12% 8%, rgba(221,211,207,0.45), transparent 55%), radial-gradient(circle at 88% 0%, rgba(239,239,239,0.7), transparent 45%)",
      }}
      aria-busy="true"
      aria-label="Loading business page"
    >
      {/* Nav bar placeholder */}
      <div
        className="fixed top-0 left-0 right-0 z-20 h-18 md:h-20 lg:h-22 flex items-center justify-between px-6 md:px-12 lg:px-20 border-b"
        style={{
          backgroundColor: ELEGANZA.surface,
          borderColor: ELEGANZA.border,
        }}
      >
        <div
          className={`${block} h-6 w-32 md:w-40`}
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        />
        <div className="hidden md:flex items-center gap-3">
          <div
            className={`${block} h-9 w-24`}
            style={{ backgroundColor: ELEGANZA.surfaceMuted }}
          />
          <div
            className={`${block} h-9 w-24`}
            style={{ backgroundColor: ELEGANZA.surfaceMuted }}
          />
        </div>
        <div
          className={`${block} h-9 w-9 md:hidden`}
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        />
      </div>

      {/* Hero placeholder — dark block matching the real hero, with lower-left
          text/button placeholders positioned like the live content. */}
      <div className="pt-18 md:pt-20 lg:pt-22">
        <div
          className="relative min-h-[85vh] w-full flex items-end pb-16 md:pb-20 px-6 md:px-12 lg:px-20 overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${ELEGANZA.inkSoft} 0%, #3a3934 55%, #4a4943 100%)`,
          }}
        >
          <div className="relative z-10 w-full max-w-[480px]">
            <div
              className={`${block} h-12 md:h-16 w-3/4 mb-5`}
              style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
            />
            <div
              className={`${block} h-4 w-full mb-2`}
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            />
            <div
              className={`${block} h-4 w-5/6 mb-6`}
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            />
            <div className="flex flex-wrap gap-3 md:gap-4">
              <div
                className={`${block} h-11 w-36`}
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              />
              <div
                className={`${block} h-11 w-36`}
                style={{ backgroundColor: ELEGANZA.cta, opacity: 0.7 }}
              />
            </div>
          </div>
        </div>

        {/* Booking step bar placeholder */}
        <div
          className="w-full border-b"
          style={{
            backgroundColor: ELEGANZA.surface,
            borderColor: ELEGANZA.border,
          }}
        >
          <div className="max-w-5xl mx-auto flex items-center">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 flex justify-center py-5">
                <div
                  className={`${block} h-4 w-20`}
                  style={{ backgroundColor: ELEGANZA.surfaceMuted }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
