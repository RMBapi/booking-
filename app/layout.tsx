import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Your Appointment | Cuebites",
  description:
    "Browse services, choose a provider, and book your next appointment in seconds.",
  openGraph: {
    title: "Book Your Appointment | Cuebites",
    description:
      "Browse services, choose a provider, and book your next appointment in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="smooth-scroll" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className="antialiased bg-[#faf9f6] font-sans text-stone-700"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
