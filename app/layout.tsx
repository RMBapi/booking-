"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib";
import { AuthProvider } from "@/contexts";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="smooth-scroll" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.remove('dark');
                localStorage.removeItem('theme');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="antialiased bg-[#faf9f6] font-sans text-stone-700"
        suppressHydrationWarning
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
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
                success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
                error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
