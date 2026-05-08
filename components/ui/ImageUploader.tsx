"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Upload, X, RefreshCw } from "lucide-react";
import { uploadImage } from "@/services";
import { cn } from "@/utils";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Invalid file type. Use JPEG, PNG, WebP, GIF, or SVG.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5MB.";
  }
  return null;
}

export interface ImageUploaderProps {
  /** "icon" → 96px square. "cover" → full-width 16:9. */
  variant: "icon" | "cover";
  /** Current image URL (already-uploaded). Pass `null` for empty. */
  value: string | null | undefined;
  /** Called with the uploaded URL once `/upload/image` returns 200. */
  onChange: (url: string | null) => void;
  /** Visible label above the uploader. */
  label?: string;
  /** Helper copy below the label. */
  hint?: string;
  /** Native form name (rarely used — prefer controlled `value`). */
  name?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  variant,
  value,
  onChange,
  label,
  hint,
  name,
  className,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;
      setError(null);
      const v = validateFile(file);
      if (v) {
        setError(v);
        return;
      }

      // Optimistically show a local preview while the network request flies.
      // The local URL is replaced by the server URL on success.
      const localUrl = URL.createObjectURL(file);
      onChange(localUrl);
      setBusy(true);
      setProgress(15);
      // Fake progressive feedback — the real call is one POST so we can't
      // hook into native progress without an XHR. Bump the bar at intervals
      // until the response lands.
      const interval = window.setInterval(() => {
        setProgress((p) => Math.min(p + 8, 90));
      }, 180);

      try {
        const url = await uploadImage(file);
        setProgress(100);
        onChange(url);
        URL.revokeObjectURL(localUrl);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Upload failed. Please try again.";
        setError(typeof message === "string" ? message : "Upload failed.");
        // Roll back to whatever was here before the local preview.
        onChange(null);
        URL.revokeObjectURL(localUrl);
      } finally {
        window.clearInterval(interval);
        setBusy(false);
        // Allow the same file to be selected again
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [disabled, onChange],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFile(e.target.files?.[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled || busy) return;
    setError(null);
    onChange(null);
  };

  const open = () => {
    if (disabled || busy) return;
    inputRef.current?.click();
  };

  const sizeClass =
    variant === "icon"
      ? "h-24 w-24 rounded-2xl"
      : "h-[200px] w-full rounded-2xl";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      <div
        onClick={open}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        className={cn(
          "relative overflow-hidden border-2 border-dashed transition-colors group cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300",
          sizeClass,
          dragOver
            ? "border-primary-400 bg-primary-50/60"
            : value
              ? "border-transparent"
              : "border-border-default bg-subtle/40 hover:border-border-strong",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={ACCEPT_ATTR}
          onChange={onInputChange}
          disabled={disabled || busy}
          className="sr-only"
        />

        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <AnimatePresence>
              {!busy && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 gap-1.5"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/90 hover:bg-white text-xs font-semibold text-text-primary"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/90 hover:bg-white text-xs font-semibold text-rose-600"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {busy && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {busy && (
              <div className="absolute top-2 right-2 inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-primary-600" />
                </motion.div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <div
              className={cn(
                "inline-flex items-center justify-center rounded-xl transition-colors",
                variant === "icon" ? "h-9 w-9" : "h-11 w-11",
                dragOver
                  ? "bg-primary-100 text-primary-700"
                  : "bg-surface text-text-tertiary border border-border-subtle",
              )}
            >
              {variant === "icon" ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            {variant === "icon" ? (
              <p className="text-[11px] font-medium text-text-secondary">Upload icon</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-secondary">
                  Drop image here or click to browse
                </p>
                <p className="text-xs text-text-tertiary">
                  Recommended: 1600×400px · JPG, PNG up to 5MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-rose-500" />
          {error}
        </p>
      )}
    </div>
  );
}
