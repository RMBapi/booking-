# BookBites by Cuebites — Marketing Site

Production rebuild of the Figma Make export (`Follow Markdown File/`) as a clean,
performant **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4** application.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (fully static)
npm run start        # serve the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run optimize:images  # regenerate optimized WebP assets from the Figma export
```

## Architecture

```
src/
├── app/                 # App Router entry, metadata, robots & sitemap
│   ├── layout.tsx       # root layout, SEO metadata, self-hosted Inter font
│   ├── page.tsx         # home page composition
│   ├── robots.ts        # robots.txt (crawlable)
│   └── sitemap.ts       # sitemap.xml
├── assets/images/       # pre-optimized WebP screenshots (static-imported)
├── components/
│   ├── ui/              # shadcn primitives actually used (button, card,
│   │                    #   input, textarea, tabs, accordion)
│   ├── shared/          # Logo, Nav, Footer, Section, typography, Reveal
│   └── sections/        # one folder/file per page section
├── constants/           # site config + all section content/data
├── hooks/               # use-scroll-animation (IntersectionObserver reveal)
├── layouts/             # SiteLayout shell (Nav + main + Footer)
├── lib/                 # cn() class-merge helper
├── styles/              # globals.css (tokens, base, keyframes)
└── types/               # shared TypeScript types
```

Content is fully data-driven from `src/constants/`, so copy/imagery changes never
require touching component markup.

## What changed vs. the export

### Performance
- **Migrated to Next.js** with a fully **static prerender** (SSG) — instant FCP,
  crawlable HTML, ~131 kB First Load JS for the home page.
- **`recharts` is lazy-loaded** (`next/dynamic`, client-only) below the fold, so
  the heavy charting library stays out of the initial bundle.
- **`next/font`** self-hosts Inter (was a render-blocking Google Fonts `@import`).
- **Dependency diet:** the export declared ~50 runtime deps (MUI, react-slick,
  react-dnd, embla, vaul, cmdk, …). Only the ~8 actually used remain.
- **Reduced motion** is respected via `prefers-reduced-motion`.

### Images
- Audited every asset. **Removed all unused images** (`image-1/2/3/6`, `image.png`,
  `1–5CRM`, `9CRM`) and dead imports.
- Re-encoded the used screenshots to **WebP**, downscaled to ~2× display size:
  **~8 MB of source PNGs → 292 KB**, with no visible quality loss and transparency
  preserved.
- Logo now uses the **vector SVG** (44 KB, crisp at any DPI) instead of a
  3001×862 PNG.
- All images use **`next/image`** → responsive AVIF/WebP `srcset`, lazy-loading,
  intrinsic dimensions (no layout shift) and auto blur placeholders.
- **Crisp on HiDPI:** UI screenshots are encoded at **WebP quality 90, sized to
  ~2× their on-screen display**, and `next/image` is set to `quality={90}`
  (overriding its soft default of 75) — the combination that keeps small text in
  the screenshots sharp on Retina without bloating file size (~0.5 MB total).

### Accessibility
- `<html>`/`<body>` carry `suppressHydrationWarning` so DOM-mutating browser
  extensions (Grammarly, Scribe, …) don't trigger a false hydration-mismatch
  warning.
- Semantic landmarks (`header`/`main`/`footer`/`nav`/`address`), correct heading
  hierarchy, `aria-label`s on nav/links, decorative icons marked `aria-hidden`.
- Contact form fields now have associated (visually-hidden) `<label>`s,
  `autocomplete` hints, and a typed email field.
- Email/phone are real `mailto:`/`tel:` links.

### Code quality
- The original single **1,192-line `App.tsx`** is split into small, focused,
  reusable components and a shared `<Reveal>` that replaces the repeated
  scroll-animation boilerplate.
- All inline `<style>` keyframe blocks consolidated into `globals.css`.
- Brand palette exposed as Tailwind tokens (`text-brand-blue`, `border-line`, …).
- Zero ESLint warnings, zero TypeScript errors, no `console`/debug artifacts.

## Deviations from the original design

1. **Hero redesigned for width & legibility** (per review feedback): the ecosystem
   now uses a full-width canvas (`max-w-[1500px]`) so cards reach toward the edges
   instead of clustering in a narrow centered column, the screenshot cards are
   ~30–45% larger, and cards/connectors/center node are re-spaced so nothing
   overlaps. The `<h1>` uses responsive sizes (`text-3xl … lg:text-[3.5rem]`) —
   still 56 px on desktop, but it scales down on phones instead of clipping (the
   original used a fixed 56 px that cropped below ~400 px). A `overflow-x: clip`
   guard on `body` prevents any accidental horizontal scroll.
2. **No-JS / crawler fallback:** scroll-reveal sections default to visible when
   scripting is unavailable (`@media (scripting: none)`); the original left them
   permanently `opacity: 0` without JS.
3. **`robots` set to indexable.** The export shipped `noindex, nofollow`, which
   would have failed the SEO target; this is a public marketing page.
4. The contact form is presentational (no backend was provided); the submit
   button is a no-op, matching the original's non-functional behavior.

> The `Follow Markdown File/` directory is the original Figma Make export, kept as
> a reference and as the source for `npm run optimize:images`. It is excluded from
> the TypeScript/ESLint/Next build and can be deleted once no longer needed.
