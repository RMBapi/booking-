"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib";
import { RoleAuthProvider } from "@/contexts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleAuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "font-sans",
            style: {
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: "500",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
      </RoleAuthProvider>
    </QueryClientProvider>
  );
}
