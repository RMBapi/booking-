"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib";
import { ELEGANZA } from "@/lib/publicBrand";
import { RoleAuthProvider } from "@/contexts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleAuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2500,
            className: "font-sans",
            style: {
              background: ELEGANZA.surface,
              color: ELEGANZA.ink,
              border: `1px solid ${ELEGANZA.border}`,
              boxShadow: "none",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: "500",
            },
            success: {
              iconTheme: { primary: ELEGANZA.accent, secondary: "#ffffff" },
              style: { borderLeft: `3px solid ${ELEGANZA.accent}` },
            },
            error: {
              duration: 3000,
              iconTheme: { primary: "#B91C1C", secondary: "#ffffff" },
              style: { borderLeft: "3px solid #B91C1C" },
            },
          }}
        />
      </RoleAuthProvider>
    </QueryClientProvider>
  );
}
