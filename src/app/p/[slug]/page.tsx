import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageViewTracker } from "@/components/PageViewTracker";
import {
  FaArrowUpRightFromSquare,
  FaGlobe,
  FaPhone,
  FaSquareFacebook,
  FaTelegram,
  FaViber,
  FaWhatsapp,
  FaTiktok,
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
  FaDiscord,
  FaEnvelope,
  FaLink,
} from "react-icons/fa6";
import { FaInstagram, FaSnapchatGhost } from "react-icons/fa";
import type { IconType } from "react-icons";
import { getAppUrl } from "@/lib/app-url";
import { normalizeIraqPhone } from "@/lib/linktree";

const PLATFORM_ICONS: Record<string, IconType> = {
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  tiktok: FaTiktok,
  viber: FaViber,
  phone: FaPhone,
  facebook: FaSquareFacebook,
  snapchat: FaSnapchatGhost,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  discord: FaDiscord,
  email: FaEnvelope,
  website: FaGlobe,
  custom: FaLink,
};

const buttonVariants = [
  "bg-white border-[#d6def1]",
  "bg-[#f8faff] border-[#d3dcf2]",
  "bg-white border-[#d6def1]",
  "bg-[#f8faff] border-[#d3dcf2]",
];

async function getPageBySlug(slug: string) {
  const base = getAppUrl();
  try {
    const res = await fetch(`${base}/api/pages/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPageBySlug(slug);
  if (!data) {
    return { title: "Page Not Found" };
  }

  const title = data.name;
  const description = data.description || `${data.name} - Contact links`;
  const image = data.image || "/images/DefaultAvatar.png";
  const baseUrl = getAppUrl();
  const canonicalUrl = `${baseUrl}/p/${data.slug}`;
  const imageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;
  const isExpired = data.status === "expired";

  return {
    title,
    description,
    robots: isExpired ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: imageUrl, width: 400, height: 400, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PageBySlug({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPageBySlug(slug);
  if (!data) notFound();

  const { name, description, image, links, showFooter = true, sponsorName = "Wafaye Sponsor", sponsorPhone } = data;
  const baseUrl = getAppUrl();
  const imageUrl = (image || "/images/DefaultAvatar.png").startsWith("http")
    ? image
    : `${baseUrl}${image || "/images/DefaultAvatar.png"}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description: description || name,
    image: imageUrl,
    url: `${baseUrl}/p/${data.slug}`,
    sameAs: (links || [])
      .filter((l: { href?: string }) => l.href?.startsWith("http") && !l.href?.includes("/api/r/"))
      .map((l: { href: string }) => l.href)
      .slice(0, 5),
  };

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[#ecf1f7] text-slate-900">
      <PageViewTracker pageId={data.id} />
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

          <div className="mx-auto w-fit">
            <Image
              src={image || "/images/DefaultAvatar.png"}
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
          <p className="mt-2 text-base text-slate-600 sm:text-lg">
            {description || "Connect with me."}
          </p>

          <nav className="mt-8 space-y-3.5 text-left sm:space-y-4">
            {(links || []).map((link: { platformId: string; label: string; href: string; color: string }, index: number) => {
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
                      style={{ backgroundColor: link.color || "#64748b" }}
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
                  href={`https://wa.me/${normalizeIraqPhone(String(sponsorPhone)) || String(sponsorPhone).replace(/\D/g, "")}`}
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
