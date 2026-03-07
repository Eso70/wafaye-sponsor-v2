import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getAppUrl } from "@/lib/app-url";

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

// TikTok Pixel base code - pixel ID from TIKTOK_PIXEL_ID in .env
function getTikTokPixelScript(pixelId: string): string {
  return `<!-- TikTok Pixel Code Start -->
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');
<!-- TikTok Pixel Code End -->`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tiktokPixelId = process.env.TIKTOK_PIXEL_ID?.trim();
  const tiktokPixelScript = tiktokPixelId ? getTikTokPixelScript(tiktokPixelId) : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {tiktokPixelScript && (
          <script dangerouslySetInnerHTML={{ __html: tiktokPixelScript }} />
        )}
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
