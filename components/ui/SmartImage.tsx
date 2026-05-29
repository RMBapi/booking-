"use client";

import React, { useEffect, useRef, useState } from "react";
import { isVideoUrl } from "@/lib/media";

interface SmartImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /**
   * When the image's aspect ratio is within `coverTolerance` of the container's,
   * we use `object-cover` (no empty space). Outside that range, we fall back to
   * `object-contain` with a blurred backdrop so the full image stays visible.
   * Default: 0.25 (i.e. ±25% from the container ratio).
   */
  coverTolerance?: number;
  /** Background tint shown while the media loads. */
  placeholderColor?: string;
  /** Optional element shown when the media is missing or fails to load. */
  fallback?: React.ReactNode;
  rounded?: string;
  /**
   * How MP4 videos should play.
   * - `autoplay`: muted loop (service cards, hero backgrounds)
   * - `controls`: user-controlled playback with native controls
   */
  videoPlayback?: "autoplay" | "controls";
  /**
   * Optional still image shown before/while a video loads (the `poster`).
   * Lets the user see imagery instantly while the video buffers, then the
   * video fades in over it.
   */
  poster?: string | null;
  /**
   * When true (videos only), the poster paints immediately and the MP4 is not
   * fetched until the page is interactive (after `window load` / idle). The
   * video then crossfades over the poster. Keeps the hero off the LCP path.
   */
  deferVideo?: boolean;
}

type FitMode = "cover" | "contain";

/**
 * SmartImage renders user-uploaded images or MP4 videos that may come in any
 * aspect ratio without awkward cropping.
 */
export function SmartImage({
  src,
  alt,
  className = "",
  coverTolerance = 0.25,
  placeholderColor = "#efefef",
  fallback,
  rounded,
  videoPlayback = "autoplay",
  poster,
  deferVideo = false,
}: SmartImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const [containerRatio, setContainerRatio] = useState<number | null>(null);
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Video crossfade state: whether the MP4 has started loading and whether it
  // has enough data to paint (used to fade the video in over the poster).
  const [videoActivated, setVideoActivated] = useState(!deferVideo);
  const [videoVisible, setVideoVisible] = useState(false);

  const resolvedSrc = src?.trim() || null;
  const isVideo = isVideoUrl(resolvedSrc);

  useEffect(() => {
    setErrored(false);
    setLoaded(false);
    setNaturalRatio(null);
    setVideoVisible(false);
    setVideoActivated(!deferVideo);
  }, [resolvedSrc, deferVideo]);

  // Defer the MP4 network load until the page is interactive so the hero video
  // never competes with the LCP poster image.
  useEffect(() => {
    if (!isVideo || !deferVideo || videoActivated) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    const activate = () => {
      if (!cancelled) setVideoActivated(true);
    };

    const schedule = () => {
      const ric = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
        }
      ).requestIdleCallback;
      if (ric) ric(activate, { timeout: 1500 });
      else window.setTimeout(activate, 300);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
    };
  }, [isVideo, deferVideo, videoActivated]);

  // Cached images may already be decoded by the time the <img> mounts, so the
  // `onLoad` event never fires and the element would stay hidden. Detect the
  // already-complete case (e.g. switching to a service whose image was shown
  // earlier in the grid) and reveal it immediately.
  useEffect(() => {
    const img = imgElRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setNaturalRatio(img.naturalWidth / img.naturalHeight);
      setLoaded(true);
    }
  }, [resolvedSrc]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setContainerRatio(w / h);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!isVideo || !video || videoPlayback !== "autoplay") return;
    if (deferVideo && !videoActivated) return;

    const play = () => {
      void video.play().catch(() => {
        /* Autoplay may be blocked until user interaction — ignore. */
      });
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [isVideo, resolvedSrc, videoPlayback, deferVideo, videoActivated]);

  const fitMode: FitMode =
    naturalRatio && containerRatio
      ? Math.abs(naturalRatio - containerRatio) / containerRatio <= coverTolerance
        ? "cover"
        : "contain"
      : "cover";

  const hasMedia = !!resolvedSrc && !errored;
  const radiusClass = rounded ?? "";
  const fitClass = fitMode === "cover" ? "object-cover" : "object-contain";
  const visibilityClass = loaded ? "opacity-100" : "opacity-0";

  const handleDimensions = (width: number, height: number) => {
    if (width > 0 && height > 0) {
      setNaturalRatio(width / height);
    }
    setLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${radiusClass} ${className}`}
      style={{ backgroundColor: placeholderColor }}
    >
      {hasMedia && !isVideo && fitMode === "contain" && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={resolvedSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{
            filter: "blur(24px) brightness(0.9)",
            transform: "scale(1.15)",
          }}
        />
      )}

      {hasMedia && isVideo ? (
        <>
          {/* Poster paints immediately (LCP-eligible) and stays beneath the
              video until the MP4 can play, then crossfades out. */}
          {poster && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoVisible ? "opacity-0" : "opacity-100"}`}
            />
          )}
          <video
            ref={videoRef}
            src={videoActivated ? resolvedSrc ?? undefined : undefined}
            poster={poster ?? undefined}
            aria-label={alt}
            controls={videoPlayback === "controls"}
            autoPlay={videoPlayback === "autoplay"}
            muted={videoPlayback === "autoplay"}
            loop={videoPlayback === "autoplay"}
            playsInline
            preload={deferVideo ? "none" : "metadata"}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              handleDimensions(video.videoWidth, video.videoHeight);
            }}
            onLoadedData={() => setVideoVisible(true)}
            onPlaying={() => setVideoVisible(true)}
            onError={() => setErrored(true)}
            className={`absolute inset-0 w-full h-full ${fitClass} transition-opacity duration-700 ${videoVisible ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : hasMedia ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgElRef}
          src={resolvedSrc}
          alt={alt}
          onLoad={(e) => {
            const img = e.currentTarget;
            handleDimensions(img.naturalWidth, img.naturalHeight);
          }}
          onError={() => setErrored(true)}
          className={`relative w-full h-full transition-opacity duration-300 ${fitClass} ${visibilityClass}`}
        />
      ) : (
        /* Media missing or failed — prefer an explicit fallback, then a poster
           still, so a video that fails to load still shows imagery. */
        fallback ??
        (poster ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={poster}
            alt={alt}
            className="relative w-full h-full object-cover"
          />
        ) : null)
      )}
    </div>
  );
}
