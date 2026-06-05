/**
 * Image optimization pipeline.
 *
 * Reads the *used* source images from the Figma Make export, downscales the
 * oversized originals to ~2x their on-screen size, and re-encodes them to
 * WebP (transparency preserved, near-lossless quality). Output lands in
 * src/assets/images, from which they are statically imported so next/image
 * can further negotiate AVIF/WebP responsive variants per request.
 *
 * Run with: npm run optimize:images
 */
import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../Follow Markdown File/src/imports");
const NEW = resolve(__dirname, "../image_new");
const OUT = resolve(__dirname, "../src/assets/images");
const PUBLIC = resolve(__dirname, "../public");

// maxWidth (px) ~= largest on-screen render * 2 for HiDPI, capped at the
// source resolution. Quality 90 keeps UI text/screenshots crisp.
const QUALITY = 90;
const jobs = [
  // Hero ecosystem cards (rendered up to ~380px wide -> ~760px @2x)
  { in: "image_49_.png", out: "hero-view-services.webp", maxWidth: 1000 },
  { in: "image_34_.png", out: "hero-customer-books.webp", maxWidth: 1000 },
  { in: "image_36_.png", out: "hero-booking-confirmed.webp", maxWidth: 1000 },
  { in: "image_40_.png", out: "hero-create-services.webp", maxWidth: 1000 },
  { in: "image_41_.png", out: "hero-configure-availability.webp", maxWidth: 1000 },
  { in: "image_42_.png", out: "hero-manage-bookings.webp", maxWidth: 1000 },
  { in: "image_43_.png", out: "hero-track-analytics.webp", maxWidth: 1000 },
  // Product showcase (image_new/) — rendered large (~800px) and opened full-size
  // in a lightbox (~1400px), so keep a generous 2400px master for sharpness.
  { dir: NEW, in: "image 4.png", out: "showcase-website-builder.webp", maxWidth: 2400 },
  { dir: NEW, in: "image 5.png", out: "showcase-crm-dashboard.webp", maxWidth: 2400 },
  // Calendar screenshots
  { in: "6CRM.png", out: "calendar-weekly.webp", maxWidth: 1500 },
  { in: "7CRM.png", out: "calendar-daily.webp", maxWidth: 1100 },
  { in: "8CRM.png", out: "calendar-monthly.webp", maxWidth: 1100 },
  // Calendar showcase (image_new/) — single full-width image (~1100px, ~2200 @2x)
  { dir: NEW, in: "image 7.png", out: "calendar-showcase.webp", maxWidth: 2400 },
  // "One platform" section (image_new/) — full-width showcase + lightbox
  { dir: NEW, in: "image 8.png", out: "one-platform.webp", maxWidth: 2400 },
  // Growth section (image_new/) — single full-width image (same size as above)
  { dir: NEW, in: "image 9.png", out: "growth-showcase.webp", maxWidth: 2400 },
  // Hero showcase screenshots (image_new/) — cards render ~550px (~1100px @2x),
  // the lightbox blows them up to ~1300px, so keep a generous 1800px master.
  { dir: NEW, in: "image 11.png", out: "hero-shot-customer-1.webp", maxWidth: 1800 },
  { dir: NEW, in: "image 22.png", out: "hero-shot-customer-2.webp", maxWidth: 1800 },
  { dir: NEW, in: "image 33.png", out: "hero-shot-business-1.webp", maxWidth: 1800 },
  { dir: NEW, in: "image 44.png", out: "hero-shot-business-2.webp", maxWidth: 1800 },
];

async function run() {
  await mkdir(OUT, { recursive: true });
  await mkdir(PUBLIC, { recursive: true });

  let totalIn = 0;
  let totalOut = 0;

  for (const job of jobs) {
    const inPath = resolve(job.dir ?? SRC, job.in);
    const outPath = resolve(OUT, job.out);
    const pipeline = sharp(inPath).resize({
      width: job.maxWidth,
      withoutEnlargement: true,
    });
    const info = await pipeline
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(outPath);

    const inMeta = await sharp(inPath).metadata();
    totalIn += inMeta.size ?? 0;
    totalOut += info.size;
    console.log(
      `${job.in.padEnd(28)} -> ${job.out.padEnd(34)} ${(info.size / 1024).toFixed(0)}KB (${info.width}x${info.height})`,
    );
  }

  // Vector logo: copy as-is (crisp at any size, ~44KB)
  await copyFile(resolve(SRC, "Group_5374.svg"), resolve(PUBLIC, "logo.svg"));
  console.log("\nGroup_5374.svg -> public/logo.svg (vector)");

  console.log(
    `\nTotal: ${(totalIn / 1024 / 1024).toFixed(2)}MB -> ${(totalOut / 1024 / 1024).toFixed(2)}MB ` +
      `(${(100 - (totalOut / totalIn) * 100).toFixed(0)}% smaller)`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
