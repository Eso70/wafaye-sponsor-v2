import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getAppUrl } from "@/lib/app-url";
import { TikTokPixel } from "@/components/analytics/TikTokPixel";

const primaryFont = localFont({
  src: "../../public/fonts/kurdishFont.woff",
  variable: "--font-primary",
  display: "swap",
});

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Wafaye Sponsor | TikTok Sponsor Bio Links",
    template: "%s | Wafaye Sponsor",
  },
  description:
    "Connect with Wafaye Sponsor. WhatsApp, Telegram, Viber & more. بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
  keywords: ["Wafaye", "sponsor", "TikTok", "bio", "links", "contact", "WhatsApp", "Telegram", "Viber", "Iraq"],
  authors: [{ name: "Wafaye Sponsor" }],
  creator: "Wafaye Sponsor",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Wafaye Sponsor",
    title: "Wafaye Sponsor | TikTok Sponsor Bio Links",
    description: "Connect with Wafaye Sponsor. All contact links in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wafaye Sponsor | TikTok Sponsor Bio Links",
    description: "Connect with Wafaye Sponsor. All contact links in one place.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        <link rel="preconnect" href="https://analytics.tiktok.com" crossOrigin="anonymous" />
        <TikTokPixel />
      </head>
      <body
        suppressHydrationWarning
        className={`${primaryFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
