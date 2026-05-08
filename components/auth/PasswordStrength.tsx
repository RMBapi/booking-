"use client";

import { useMemo } from "react";
import { cn } from "@/utils";

interface Props {
  password: string;
}

interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

function score(password: string): Strength {
  if (!password) return { score: 0, label: "Empty", color: "bg-gray-200" };
  let s = 0;
  if (password.length >= 8) s++;
  if (password.length >= 12) s++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
  if (/\d/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  const clamped = Math.min(4, s) as Strength["score"];
  const labels = ["Empty", "Weak", "Okay", "Strong", "Very strong"] as const;
  const colors = [
    "bg-gray-200",
    "bg-red-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-600",
  ];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

export function PasswordStrength({ password }: Props) {
  const { score: s, label, color } = useMemo(() => score(password), [password]);
  if (!password) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < s ? color : "bg-gray-200",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Strength: <span className="font-medium text-gray-700">{label}</span>
      </p>
    </div>
  );
}
