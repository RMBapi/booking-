"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element once it scrolls into view. Returns a ref to attach to the
 * target and an `isVisible` flag to toggle the reveal animation. The observer
 * disconnects after the first intersection so it never re-runs.
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
