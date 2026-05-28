import type { Metadata } from "next";
import { Inter, Marcellus } from "next/font/google";
import { Providers } from "./providers";
import { ELEGANZA_TEXT_REVEAL_LOADER } from "@/lib/assets";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const marcellus = Marcellus({
  subsets: ["latin"],
  variable: "--font-marcellus",
  weight: "400",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="preload"
          href={ELEGANZA_TEXT_REVEAL_LOADER}
          as="image"
          type="image/gif"
        />
      </head>
      <body
        className={`${inter.variable} ${marcellus.variable} antialiased bg-[#fafafa] font-sans text-[#222222]`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
