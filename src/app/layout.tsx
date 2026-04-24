import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import { SessionProvider } from "next-auth/react";
import NearDearGuide from "@/components/NearDearGuide";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NearDear — Someone near. Someone dear.",
  description:
    "Find a verified NearDear companion for your parents or loved ones. India's human-presence marketplace.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "NearDear — Someone near. Someone dear.",
    description: "Find a verified NearDear companion for your parents or loved ones. India's human-presence marketplace.",
    siteName: "NearDear",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} antialiased font-[family-name:var(--font-dm-sans)]`}
      >
        <SessionProvider>
          <LanguageProvider>{children}</LanguageProvider>
          <NearDearGuide />
        </SessionProvider>
      </body>
    </html>
  );
}
