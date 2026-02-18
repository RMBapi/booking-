"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib";
import { AuthProvider, RoleAuthProvider } from "@/contexts";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Force light mode - remove any dark mode classes
                document.documentElement.classList.remove('dark');
                localStorage.removeItem('theme');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[#faf9f6] font-sans text-stone-700" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <RoleAuthProvider>
            <AuthProvider>
              {children}
              <Toaster 
                position="top-right"
                toastOptions={{
                  className: 'font-sans',
                  style: {
                    borderRadius: '0.75rem',
                    padding: '1rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  },
                  success: {
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </RoleAuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
