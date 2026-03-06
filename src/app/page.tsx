import Image from "next/image";
import Link from "next/link";
import {
  FaArrowUpRightFromSquare,
  FaGlobe,
  FaPhone,
  FaSquareFacebook,
  FaTelegram,
  FaViber,
  FaWhatsapp,
} from "react-icons/fa6";
import { FaInstagram, FaSnapchatGhost } from "react-icons/fa";
import type { IconType } from "react-icons";
import { PageViewTracker } from "@/components/PageViewTracker";

const PLATFORM_ICONS: Record<string, IconType> = {
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  viber: FaViber,
  phone: FaPhone,
  facebook: FaSquareFacebook,
  instagram: FaInstagram,
  snapchat: FaSnapchatGhost,
  custom: FaGlobe,
};

type LinkItem = { id?: number; label: string; href: string; color: string; platformId: string };

const buttonVariants = [
  "bg-white border-[#d6def1]",
  "bg-[#f8faff] border-[#d3dcf2]",
  "bg-white border-[#d6def1]",
  "bg-[#f8faff] border-[#d3dcf2]",
];

async function getOfficialPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/pages/official`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata() {
  const data = await getOfficialPage();
  const title = data?.name ?? "Wafaye Sponsor";
  const description = data?.description ?? "Connect with Wafaye Sponsor. WhatsApp, Telegram, Viber & more.";
  const image = data?.image ?? "/images/Logo.jpg";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const imageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 400, height: 400, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: baseUrl,
    },
  };
}

export default async function Home() {
  const data = await getOfficialPage();
  const name = data?.name ?? "Wafaye Sponsor";
  const description = data?.description ?? "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";
  const image = data?.image ?? "/images/Logo.jpg";
  const showFooter = data?.showFooter !== false;
  const sponsorName = data?.sponsorName ?? "Wafaye Sponsor";
  const sponsorPhone = data?.sponsorPhone;
  const links: LinkItem[] = data?.links ?? [
    { id: 0, label: "WhatsApp", href: "https://wa.me/9647509516125", color: "#25D366", platformId: "whatsapp" },
    { id: 0, label: "Telegram", href: "https://t.me/waf_aye", color: "#229ED9", platformId: "telegram" },
    { id: 0, label: "Viber", href: "viber://chat?number=+9647509516125", color: "#7360F2", platformId: "viber" },
    { id: 0, label: "Phone Call", href: "tel:+9647509516125", color: "#1F5CE0", platformId: "phone" },
  ];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const imageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description,
    image: imageUrl,
    url: baseUrl,
    sameAs: links
      .filter((l) => l.href?.startsWith("http") && !l.href.includes("/api/r/"))
      .map((l) => l.href)
      .slice(0, 5),
  };

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[#ecf1f7] text-slate-900">
      {data?.id ? <PageViewTracker pageId={data.id} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#0a1f6a]/10" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#67f0ec]/15" />
        <div className="pointer-events-none absolute left-8 top-10 hidden h-28 w-28 rounded-full border border-[#1f5ce0]/20 sm:block" />
        <div className="pointer-events-none absolute right-10 bottom-14 hidden grid grid-cols-5 gap-1.5 opacity-25 sm:grid">
          {Array.from({ length: 25 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#1f5ce0]" />
          ))}
        </div>

        <div className="w-full max-w-md text-center">
          <p className="mx-auto mb-4 inline-flex items-center rounded-full border border-[#a9bbee] bg-white/65 px-3 py-1 text-xs font-medium text-[#2048bf] backdrop-blur">
            Official Sponsor Bio
          </p>

          <div className="mx-auto w-fit">
            <Image
              src={image}
              alt={name}
              width={120}
              height={120}
              className="h-24 w-24 rounded-full border border-[#16338f]/20 object-cover shadow-[0_14px_36px_rgba(9,30,99,0.2)]"
              priority
            />
          </div>

          <h1 className="mt-5 text-[2rem] font-semibold tracking-tight text-[#08133f] sm:text-4xl">
            {name}
          </h1>
          <p className="mt-2 text-base text-slate-600 sm:text-lg">{description}</p>

          <nav className="mt-8 space-y-3.5 text-left sm:space-y-4">
            {links.map((link, index) => {
              const Icon = PLATFORM_ICONS[link.platformId] ?? FaGlobe;
              return (
                <a
                  key={`${link.platformId}-${index}`}
                  href={link.href}
                  target={link.href.startsWith("http") || link.href.startsWith("viber") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`group flex min-h-[58px] items-center justify-between rounded-full border px-4 py-3 text-base font-semibold text-[#0f1f5f] shadow-[0_8px_20px_rgba(17,52,150,0.1)] transition hover:-translate-y-0.5 hover:border-[#1b49d0] hover:shadow-[0_14px_32px_rgba(17,52,150,0.18)] sm:min-h-[62px] sm:px-5 ${buttonVariants[index % buttonVariants.length]}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-[0_6px_14px_rgba(0,0,0,0.2)] sm:h-12 sm:w-12"
                      style={{ backgroundColor: link.color }}
                    >
                      <Icon className="text-lg sm:text-xl" />
                    </span>
                    <span>{link.label}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition group-hover:text-[#1f5ce0] sm:text-sm">
                    Open
                    <FaArrowUpRightFromSquare className="text-[11px]" />
                  </span>
                </a>
              );
            })}
          </nav>

          {showFooter && (
            <div className="mt-8 text-center">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#cdd8f2]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#1f5ce0]/50" />
                <span className="h-px flex-1 bg-[#cdd8f2]" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Sponsored by
              </p>
              {sponsorPhone ? (
                <a
                  href={`https://wa.me/${sponsorPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[50px] items-center justify-center rounded-full border border-[#1f5ce0]/55 bg-white/20 px-9 py-3 text-sm font-semibold text-[#10359d] shadow-[0_10px_26px_rgba(17,52,150,0.14)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#1f5ce0]/80 hover:bg-white/30"
                >
                  {sponsorName}
                </a>
              ) : (
                <Link
                  href="/"
                  className="mt-3 inline-flex min-h-[50px] items-center justify-center rounded-full border border-[#1f5ce0]/55 bg-white/20 px-9 py-3 text-sm font-semibold text-[#10359d] shadow-[0_10px_26px_rgba(17,52,150,0.14)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#1f5ce0]/80 hover:bg-white/30"
                >
                  {sponsorName}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
