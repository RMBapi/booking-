"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Maximize2,
  Menu,
} from "lucide-react";
import { BRAND } from "@/lib/publicBrand";
import { fadeUp, fadeIn, EASE_OUT_QUART, VP } from "../_constants";
import { getBusinessBySlug } from "@/services";
import { Business } from "@/types";
import { PageLoader } from "@/components";

const GALLERY_IMAGES = [
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/1-Chair.jpeg", alt: "Barber Chair", width: 1067, height: 1600 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/2-Hat.jpeg", alt: "Vintage Hat", width: 1067, height: 1600 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/3-Whiskey.jpeg", alt: "Whiskey Collection", width: 1125, height: 893 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/4-Entrance-Inside.jpeg", alt: "Interior Entrance", width: 1600, height: 1066 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/6-Shaving.jpeg", alt: "Shaving Tools", width: 1066, height: 1600 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/5-Praraso.jpeg", alt: "Proraso Products", width: 1600, height: 1066 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/7-Yellow-Prasso.jpeg", alt: "Yellow Proraso Display", width: 1600, height: 1066 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/8-Cups.jpeg", alt: "Vintage Cups", width: 1067, height: 1600 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/9-Open-Sign.jpeg", alt: "Open Sign", width: 1600, height: 1066 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/10-Ontop-of-Brush.jpeg", alt: "Brushes Display", width: 1600, height: 1067 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/11-Uppercut.jpeg", alt: "Uppercut Products", width: 1067, height: 1600 },
  { src: "https://ik.imagekit.io/rt5orcibzuy/wp-content/uploads/2021/03/12-Outside.jpeg", alt: "Outside View", width: 1600, height: 1067 },
];

const ROWS = [
  GALLERY_IMAGES.slice(0, 4),
  GALLERY_IMAGES.slice(4, 8),
  GALLERY_IMAGES.slice(8, 12),
];

function Lightbox({
  index,
  onClose,
  onNext,
  onPrev,
}: {
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const touchStartX = useRef(0);
  const image = GALLERY_IMAGES[index];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) onNext();
      else onPrev();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/92 flex items-center justify-center select-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6 text-white/60 text-sm font-bold z-10">
        {index + 1} / {GALLERY_IMAGES.length}
      </div>

      <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex items-center gap-2 z-10">
        <button
          className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            document.documentElement.requestFullscreen?.();
          }}
          aria-label="Fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        <button
          className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <button
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="max-w-[90vw] max-h-[85vh] sm:max-w-[85vw] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: "85vh" }}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      <button
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </motion.div>
  );
}

export default function GalleryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const data = await getBusinessBySlug(slug);
        if (data.success) setBusiness(data.data);
      } catch {
        /* business name will fall back to generic */
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBusiness();
  }, [slug]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % GALLERY_IMAGES.length : null,
    );
  }, []);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null
        ? (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length
        : null,
    );
  }, []);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, goNext, goPrev]);

  if (loading) return <PageLoader />;

  const businessName = business?.name || "Business";
  const basePath = `/business/slug/${slug}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BRAND.dark }}>
      {/* ── Navigation ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-18 md:h-20 lg:h-22 flex items-center justify-between px-6 lg:px-16"
        style={{
          backgroundColor: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4 py-2 pr-4 md:pr-8">
          <span
            className="font-extrabold text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.25rem] uppercase tracking-[0.08em] transition-opacity duration-200 hover:opacity-85"
            style={{ color: BRAND.dark }}
          >
            {businessName}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Home", href: basePath, hash: null },
            { label: "Gallery", href: null, hash: null },
            { label: "Contact", href: basePath, hash: "bookings" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (!item.href) return;
                if (item.hash) {
                  router.push(item.href);
                  setTimeout(() => {
                    document.getElementById(item.hash!)?.scrollIntoView({ behavior: "smooth" });
                  }, 600);
                } else {
                  router.push(item.href);
                }
              }}
              className="text-sm font-bold uppercase tracking-widest transition-colors relative pb-1"
              style={{
                color: item.href === null ? BRAND.dark : "#888",
                cursor: item.href === null ? "default" : "pointer",
              }}
            >
              {item.label}
              {item.href === null && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: BRAND.accent }}
                />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
          style={{ color: BRAND.dark }}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <div className="hidden md:block" />
      </nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
            className="fixed top-18 md:top-20 left-0 right-0 z-40 flex flex-col gap-1 px-6 py-4 shadow-xl bg-white"
          >
            {[
              { label: "Home", href: basePath, hash: null },
              { label: "Gallery", href: null, hash: null },
              { label: "Contact", href: basePath, hash: "bookings" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (!item.href) return;
                  if (item.hash) {
                    router.push(item.href);
                    setTimeout(() => {
                      document.getElementById(item.hash!)?.scrollIntoView({ behavior: "smooth" });
                    }, 600);
                  } else {
                    router.push(item.href);
                  }
                }}
                className="text-left py-3 text-sm font-bold uppercase tracking-widest border-b last:border-0"
                style={{
                  color: item.href === null ? BRAND.accent : BRAND.dark,
                  borderColor: "#eee",
                }}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-20" />

      {/* ── Justified Image Grid (Desktop) ── */}
      <div className="hidden sm:block flex-1">
        {ROWS.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="flex w-full"
            style={{ height: "clamp(220px, 28vw, 420px)" }}
          >
            {row.map((image, colIndex) => {
              const globalIndex = rowIndex * 4 + colIndex;
              const aspectRatio = image.width / image.height;
              return (
                <div
                  key={globalIndex}
                  className="relative overflow-hidden cursor-pointer group"
                  style={{ flexGrow: aspectRatio, flexBasis: 0 }}
                  onClick={() => openLightbox(globalIndex)}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>

      {/* ── Grid Layout (Mobile) ── */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="sm:hidden grid grid-cols-2 flex-1"
      >
        {GALLERY_IMAGES.map((image, index) => (
          <div
            key={index}
            className="relative overflow-hidden cursor-pointer group aspect-square"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Footer ── */}
      <motion.footer
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
        className="border-t py-10 px-6 lg:px-16"
        style={{
          backgroundColor: BRAND.darker,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span
              className="font-black uppercase tracking-widest text-white"
              style={{ fontSize: "1.1rem", letterSpacing: "0.1em" }}
            >
              {businessName.toUpperCase()}
            </span>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              &copy; {new Date().getFullYear()} {businessName}. All rights
              reserved.
            </p>
          </div>
        </div>
      </motion.footer>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            index={lightboxIndex}
            onClose={closeLightbox}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
