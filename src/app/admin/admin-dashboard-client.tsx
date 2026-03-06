"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowDown,
  FaArrowsRotate,
  FaArrowTrendUp,
  FaArrowUp,
  FaArrowUpRightFromSquare,
  FaBars,
  FaBolt,
  FaGear,
  FaCheck,
  FaCircleCheck,
  FaChevronDown,
  FaClock,
  FaCopy,
  FaDiscord,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaFilter,
  FaGlobe,
  FaHouse,
  FaImage,
  FaKey,
  FaLink,
  FaLinkedin,
  FaMagnifyingGlass,
  FaPencil,
  FaPhone,
  FaPowerOff,
  FaSquareFacebook,
  FaTableList,
  FaTelegram,
  FaTiktok,
  FaTrash,
  FaXTwitter,
  FaUserPen,
  FaViber,
  FaWhatsapp,
  FaXmark,
  FaYoutube,
} from "react-icons/fa6";
import { FaInstagram, FaSnapchatGhost } from "react-icons/fa";
import {
  FaList,
  FaRegCalendarAlt,
  FaRegClock,
  FaRegUserCircle,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import { DeleteModal } from "@/components/DeleteModal";
import { ExpireDatePicker } from "@/components/ExpireDatePicker";
import { formatIraqPhoneForInput } from "@/lib/phone";

type LinktreePage = {
  id: number;
  name: string;
  description: string;
  profileImage: string;
  pageUrl: string;
  status: "active" | "expires_soon" | "expired";
  expiresAt: string;
  views: number;
  clicks: number;
  isOfficial?: boolean;
  updatedAt: string;
};

type PlatformId =
  | "whatsapp"
  | "telegram"
  | "tiktok"
  | "viber"
  | "phone"
  | "facebook"
  | "snapchat"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "youtube"
  | "discord"
  | "email"
  | "website"
  | "custom";

const PLATFORM_CONFIG: Record<
  PlatformId,
  { label: string; type: "phone" | "username" | "url" | "custom"; placeholder: string; prefix?: string; color: string; icon: IconType }
> = {
  whatsapp: { label: "WhatsApp", type: "phone", placeholder: "07501234567 or 7501234567", color: "#25D366", icon: FaWhatsapp },
  telegram: { label: "Telegram", type: "username", placeholder: "username", prefix: "https://t.me/", color: "#0088cc", icon: FaTelegram },
  tiktok: { label: "TikTok", type: "username", placeholder: "@username", prefix: "https://tiktok.com/@", color: "#000000", icon: FaTiktok },
  viber: { label: "Viber", type: "phone", placeholder: "07501234567 or 7501234567", color: "#7360F2", icon: FaViber },
  phone: { label: "Phone Call", type: "phone", placeholder: "07501234567 or 7501234567", color: "#1F5CE0", icon: FaPhone },
  facebook: { label: "Facebook", type: "url", placeholder: "https://facebook.com/...", color: "#1877F2", icon: FaSquareFacebook },
  snapchat: { label: "Snapchat", type: "username", placeholder: "username", prefix: "https://snapchat.com/add/", color: "#FFFC00", icon: FaSnapchatGhost },
  instagram: { label: "Instagram", type: "username", placeholder: "@username", prefix: "https://instagram.com/", color: "#E4405F", icon: FaInstagram },
  linkedin: { label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/...", color: "#0A66C2", icon: FaLinkedin },
  twitter: { label: "Twitter / X", type: "username", placeholder: "@username", prefix: "https://x.com/", color: "#111111", icon: FaXTwitter },
  youtube: { label: "YouTube", type: "url", placeholder: "https://youtube.com/...", color: "#FF0000", icon: FaYoutube },
  discord: { label: "Discord", type: "username", placeholder: "username", prefix: "https://discord.com/users/", color: "#5865F2", icon: FaDiscord },
  email: { label: "Email", type: "custom", placeholder: "name@example.com", color: "#9CA3AF", icon: FaEnvelope },
  website: { label: "Website", type: "url", placeholder: "https://example.com", color: "#6366f1", icon: FaGlobe },
  custom: { label: "Custom Link", type: "custom", placeholder: "https://...", color: "#64748b", icon: FaLink },
};

const PLATFORM_BUTTON_STYLE: Record<
  PlatformId,
  { iconGradient: string; iconColor: string }
> = {
  whatsapp: {
    iconGradient: "linear-gradient(135deg,#46d39a 0%,#42c78f 100%)",
    iconColor: "#ffffff",
  },
  telegram: {
    iconGradient: "linear-gradient(135deg,#62c9eb 0%,#42b8df 100%)",
    iconColor: "#ffffff",
  },
  tiktok: {
    iconGradient: "linear-gradient(135deg,#434750 0%,#2f3440 100%)",
    iconColor: "#ffffff",
  },
  viber: {
    iconGradient: "linear-gradient(135deg,#9b6df3 0%,#ce5de6 100%)",
    iconColor: "#ffffff",
  },
  phone: {
    iconGradient: "linear-gradient(135deg,#6b7ef0 0%,#8f9df9 100%)",
    iconColor: "#ffffff",
  },
  facebook: {
    iconGradient: "linear-gradient(135deg,#5c7fe5 0%,#4d6fd6 100%)",
    iconColor: "#ffffff",
  },
  snapchat: {
    iconGradient: "linear-gradient(135deg,#f7cf54 0%,#e8bb37 100%)",
    iconColor: "#ffffff",
  },
  instagram: {
    iconGradient: "linear-gradient(135deg,#f55f9f 0%,#ff7f4f 100%)",
    iconColor: "#ffffff",
  },
  linkedin: {
    iconGradient: "linear-gradient(135deg,#5c7fe5 0%,#4d6fd6 100%)",
    iconColor: "#ffffff",
  },
  twitter: {
    iconGradient: "linear-gradient(135deg,#2f3336 0%,#111111 100%)",
    iconColor: "#ffffff",
  },
  youtube: {
    iconGradient: "linear-gradient(135deg,#ff4d4d 0%,#E11D48 100%)",
    iconColor: "#ffffff",
  },
  discord: {
    iconGradient: "linear-gradient(135deg,#7c82ff 0%,#5865F2 100%)",
    iconColor: "#ffffff",
  },
  email: {
    iconGradient: "linear-gradient(135deg,#c7ced9 0%,#9CA3AF 100%)",
    iconColor: "#ffffff",
  },
  website: {
    iconGradient: "linear-gradient(135deg,#76dbd2 0%,#66d1c6 100%)",
    iconColor: "#ffffff",
  },
  custom: {
    iconGradient: "linear-gradient(135deg,#8a96ab 0%,#707d95 100%)",
    iconColor: "#ffffff",
  },
};

type AdminView = "dashboard" | "settings";

const menuItems: Array<{ id: AdminView; label: string; icon: IconType }> = [
  { id: "dashboard", label: "Dashboard", icon: FaHouse },
  { id: "settings", label: "Settings", icon: FaGear },
];

type FilterStatus = "all" | LinktreePage["status"];
type SortBy = "name" | "views" | "clicks" | "expiresAt" | "updatedAt";
type ViewMode = "grid" | "list";
type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

const statusFilterOptions: DropdownOption<FilterStatus>[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "expires_soon", label: "Expires Soon" },
  { value: "expired", label: "Expired" },
];

const sortOptions: DropdownOption<SortBy>[] = [
  { value: "updatedAt", label: "Sort: Latest Update" },
  { value: "views", label: "Sort: Most Views" },
  { value: "clicks", label: "Sort: Most Clicks" },
  { value: "expiresAt", label: "Sort: Nearest Expiry" },
  { value: "name", label: "Sort: A-Z" },
];


function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

// Generate mock platform click breakdown from total clicks (for analytics view)
function getPlatformClicks(totalClicks: number): Array<{ platformId: PlatformId; clicks: number }> {
  const weights: Array<{ id: PlatformId; weight: number }> = [
    { id: "whatsapp", weight: 0.32 },
    { id: "telegram", weight: 0.24 },
    { id: "tiktok", weight: 0.18 },
    { id: "instagram", weight: 0.12 },
    { id: "phone", weight: 0.08 },
    { id: "viber", weight: 0.04 },
    { id: "website", weight: 0.02 },
  ];
  return weights
    .map(({ id, weight }) => ({ platformId: id, clicks: Math.round(totalClicks * weight) }))
    .filter((p) => p.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks);
}

function formatDate(dateText: string): string {
  const date = new Date(`${dateText}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function statusClass(status: LinktreePage["status"], isOfficial?: boolean): string {
  if (isOfficial) return "bg-[#e8efff] text-[#1a43b6] border border-[#cfe0ff]";
  if (status === "active") return "bg-[#e8efff] text-[#1a43b6] border border-[#cfe0ff]";
  if (status === "expires_soon") return "bg-[#e2f7fb] text-[#0b6a86] border border-[#bfe9f3]";
  return "bg-rose-100 text-rose-700 border border-rose-200";
}

function statusLabel(status: LinktreePage["status"], isOfficial?: boolean): string {
  if (isOfficial) return "Never expires";
  if (status === "active") return "Active";
  if (status === "expires_soon") return "Expires Soon";
  return "Expired";
}

function daysUntil(dateText: string): number {
  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${dateText}T00:00:00`);
  const diff = target.getTime() - current.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function expiryProgress(dateText: string): number {
  const remaining = daysUntil(dateText);
  if (remaining <= 0) return 100;
  if (remaining <= 30) return 85;
  if (remaining <= 90) return 50;
  return 20;
}

const DEFAULT_SPONSOR_KEY = "wafaye_default_sponsor_name";

function sortPages(items: LinktreePage[], sortBy: SortBy): LinktreePage[] {
  const next = [...items];
  next.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "views") return b.views - a.views;
    if (sortBy === "clicks") return b.clicks - a.clicks;
    if (sortBy === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
    return a.expiresAt.localeCompare(b.expiresAt);
  });
  return next;
}

function SettingsView() {
  const [pixelId, setPixelId] = useState("");
  const [eventApiToken, setEventApiToken] = useState("");
  const [testEventCode, setTestEventCode] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [showPixelId, setShowPixelId] = useState(false);
  const [showEventApiToken, setShowEventApiToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as {
          TIKTOK_PIXEL_ID?: string;
          TIKTOK_EVENT_API_ACCESS_TOKEN?: string;
          TIKTOK_TEST_EVENT_CODE?: string;
        };
        setPixelId(data.TIKTOK_PIXEL_ID ?? "");
        setEventApiToken(data.TIKTOK_EVENT_API_ACCESS_TOKEN ?? "");
        const code = data.TIKTOK_TEST_EVENT_CODE ?? "";
        setTestEventCode(code);
        setTestMode(!!code);
      } catch {
        setMessage({ type: "error", text: "Could not load TikTok settings." });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TIKTOK_PIXEL_ID: pixelId.trim(),
          TIKTOK_EVENT_API_ACCESS_TOKEN: eventApiToken.trim(),
          TIKTOK_TEST_EVENT_CODE: testMode ? testEventCode.trim() : "",
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? "Failed to save." });
        return;
      }
      setMessage({ type: "success", text: "Saved to .env. Restart the server for changes to take effect." });
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-[#1b49d0] focus:ring-2 focus:ring-[#c8d6ff]";

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-slate-500">Loading TikTok settings…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <section className="rounded-[1.5rem] border border-[#d6e3ff] bg-[linear-gradient(165deg,#ffffff_0%,#f7fbff_65%,#f5fffa_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
            <FaTiktok className="text-sm" />
          </span>
          TikTok Management
        </h3>
        <p className="mb-6 text-sm text-slate-600">
          Configure TikTok Pixel and Events API. Changes are written directly to your{" "}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">.env</code> file.
        </p>

        {message ? (
          <p
            className={`mb-6 rounded-full px-4 py-2.5 text-sm font-medium ${
              message.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">TikTok Pixel ID</span>
              <div className="relative">
                <input
                  type={showPixelId ? "text" : "password"}
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="e.g. D59UO0JC77U9GK0PKDHG"
                  maxLength={32}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPixelId((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                  aria-label={showPixelId ? "Hide Pixel ID" : "Show Pixel ID"}
                  title={showPixelId ? "Hide" : "Show"}
                >
                  {showPixelId ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                ~20-char alphanumeric. Find in Events Manager → Tools → Events → your pixel → ID.
              </p>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">TikTok Events API Access Token</span>
              <div className="relative">
                <input
                  type={showEventApiToken ? "text" : "password"}
                  value={eventApiToken}
                  onChange={(e) => setEventApiToken(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="Generate in Events Manager → Events API"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowEventApiToken((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                  aria-label={showEventApiToken ? "Hide token" : "Show token"}
                  title={showEventApiToken ? "Hide" : "Show"}
                >
                  {showEventApiToken ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Server-side Conversions API. Captures ~20–35% more conversions vs Pixel alone. Keep secret.
              </p>
            </label>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="block text-sm font-medium text-amber-900">Test Mode</span>
                <span className="text-xs text-amber-800">
                  Send events to Test Events tab without affecting live data.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTestMode((p) => !p)}
                role="switch"
                aria-checked={testMode}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                  testMode ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    testMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {testMode ? (
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-medium text-amber-800">Test Event Code</span>
                <input
                  type="text"
                  value={testEventCode}
                  onChange={(e) => setTestEventCode(e.target.value)}
                  className="w-full rounded-full border border-amber-300 bg-white px-4 py-2 text-sm"
                  placeholder="e.g. TEST93891"
                />
                <p className="mt-1 text-[11px] text-amber-700">
                  From Events Manager → Test Events tab. Remove before going live.
                </p>
              </label>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[linear-gradient(90deg,#000000_0%,#333333_100%)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
          >
            {saving ? "Saving…" : "Save to .env"}
          </button>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-[#d4e2ff] bg-[linear-gradient(165deg,#f8fbff_0%,#f0f9ff_100%)] p-6 shadow-sm">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FaCircleCheck className="text-emerald-600" />
          Best practices for best results
        </h4>
        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FaCheck className="text-[10px]" />
            </span>
            <span>
              <strong>Use Pixel + Events API together</strong> — TikTok recommends both for maximum performance (client-side blockers miss 20–35% of conversions).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FaCheck className="text-[10px]" />
            </span>
            <span>
              <strong>Event deduplication</strong> — Pass the same <code className="rounded bg-slate-200 px-1 text-xs">event_id</code> in Pixel and Events API to avoid double-counting (48h window).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FaCheck className="text-[10px]" />
            </span>
            <span>
              <strong>Event Match Quality 8.0+</strong> — Include hashed PII (email, phone, ttclid) for better targeting. Aim for score 6+ minimum.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FaCheck className="text-[10px]" />
            </span>
            <span>
              <strong>Standard events</strong> — ViewContent, AddToCart, CompletePayment for e‑commerce. Use consistent events across Pixel and API.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}

export function AdminDashboardClient({ username }: { username: string }) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<"password" | "username">("password");
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [linktreePages, setLinktreePages] = useState<LinktreePage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: LinktreePage[]) => setLinktreePages(data))
      .catch(() => setPagesError("Could not load pages"))
      .finally(() => setPagesLoading(false));
  }, []);

  async function loadPages(): Promise<LinktreePage[]> {
    setPagesError(null);
    try {
      const res = await fetch("/api/admin/pages");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: LinktreePage[] = await res.json();
      setLinktreePages(data);
      return data;
    } catch {
      setPagesError("Could not load pages");
      return [];
    }
  }
  const [createPageModalOpen, setCreatePageModalOpen] = useState(false);
  const [editPage, setEditPage] = useState<LinktreePage | null>(null);
  const [deletePage, setDeletePage] = useState<LinktreePage | null>(null);
  const [clearAnalyticsModalOpen, setClearAnalyticsModalOpen] = useState(false);
  const [viewPage, setViewPage] = useState<LinktreePage | null>(null);
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [refreshingDashboard, setRefreshingDashboard] = useState(false);

  const totals = useMemo(() => {
    const totalPages = linktreePages.length;
    const totalViews = linktreePages.reduce((sum, item) => sum + item.views, 0);
    const totalClicks = linktreePages.reduce((sum, item) => sum + item.clicks, 0);
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const activeCount = linktreePages.filter((item) => item.status === "active").length;
    return { totalPages, totalViews, totalClicks, ctr, activeCount };
  }, [linktreePages]);

  const filteredPages = useMemo(() => {
    const cleanedQuery = query.trim().toLowerCase();
    const matched = linktreePages.filter((page) => {
      const searchable =
        `${page.name} ${page.description} ${page.pageUrl}`.toLowerCase();
      const matchesQuery = cleanedQuery.length === 0 || searchable.includes(cleanedQuery);
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    return sortPages(matched, sortBy);
  }, [linktreePages, query, statusFilter, sortBy]);

  async function refreshDashboard() {
    setRefreshingDashboard(true);
    await loadPages();
    router.refresh();
    await new Promise((r) => setTimeout(r, 400));
    setRefreshingDashboard(false);
  }

  async function copyLink(page: LinktreePage) {
    try {
      await navigator.clipboard.writeText(page.pageUrl);
      setCopiedId(page.id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(currentDateTime);

  const currentTime = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(currentDateTime);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_8%_12%,#dbe7ff_0%,transparent_28%),radial-gradient(circle_at_92%_85%,#d3f4ec_0%,transparent_32%),radial-gradient(circle_at_55%_8%,#ffe8d6_0%,transparent_22%),#edf3fb] text-slate-900">
      <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[#4d6bff]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-20 h-72 w-72 rounded-full bg-[#2ac7a6]/20 blur-3xl" />

      {mobileSidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          type="button"
        />
      ) : null}

      <section className="relative z-10 flex w-full">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[min(320px,88vw)] flex-col border-r border-[#dbe4fb]/80 bg-gradient-to-b from-[#fafbff] to-[#f5f8ff] p-4 shadow-[0_30px_70px_rgba(15,23,42,0.35)] transition-transform duration-300 lg:w-[280px] lg:translate-x-0 lg:shadow-none ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="pointer-events-none absolute -right-8 top-20 h-24 w-24 rounded-full bg-[#1f5ce0]/8 blur-2xl" />
          <div className="pointer-events-none absolute -left-4 bottom-32 h-20 w-20 rounded-full bg-[#14b8a6]/10 blur-2xl" />
          <div className="pointer-events-none absolute right-2 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border border-[#d7e3ff]/40" />

          <div className="relative mb-4 flex items-center justify-between lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Navigation</p>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d6e1fb] bg-white text-[#2448a2] shadow-sm transition hover:border-[#1f5ce0]/50 hover:bg-[#f5f8ff]"
            >
              <FaXmark className="text-base" />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-[#d7e3ff]/60 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] p-4 shadow-[0_8px_24px_rgba(31,92,224,0.08)]">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#1f5ce0]/5" />
            <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-[#14b8a6]/5" />
            <div className="relative flex items-center gap-3">
              <Image
                src="/images/Logo.jpg"
                alt="Wafaye"
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-lg"
              />
              <div>
                <p className="text-lg font-bold tracking-tight text-[#0f172a]">Wafaye Control</p>
                <p className="text-xs font-medium text-slate-500">Sponsor admin system</p>
              </div>
            </div>
          </div>

          <div className="relative my-6 flex items-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d7e3ff] to-transparent" />
            <span className="h-2 w-2 rotate-45 rounded-sm bg-[#1f5ce0]/30" />
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d7e3ff] to-transparent" />
          </div>

          <div className="relative">
            <p className="mb-3 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f5ce0]" />
              Menu
            </p>
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const isSettings = item.id === "settings";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveView(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-base font-medium transition-all ${
                      isActive
                        ? isSettings
                          ? "border-2 border-[#bde7f3] bg-gradient-to-r from-[#e6f9ff] to-[#e0f7fc] text-[#0b6a86] shadow-sm"
                          : "border-2 border-[#d7e3ff] bg-gradient-to-r from-[#edf3ff] to-[#e8f0ff] text-[#1f4fb3] shadow-sm"
                        : "border-2 border-transparent text-slate-600 hover:border-[#e2e8f0] hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isActive ? (isSettings ? "bg-[#0b6a86]/15 text-[#0b6a86]" : "bg-[#1f5ce0]/15 text-[#1f4fb3]") : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="text-sm" />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="relative mt-auto pt-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f0b9c1] to-transparent" />
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400/60" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f0b9c1] to-transparent" />
            </div>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-rose-50/50 px-4 py-3 text-base font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:from-rose-100 hover:to-rose-50 disabled:opacity-70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <FaPowerOff className="text-sm text-rose-600" />
              </span>
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        <div
          className={`flex min-h-dvh min-w-0 flex-1 flex-col transition lg:ml-[280px] lg:h-dvh ${
            mobileSidebarOpen ? "blur-[2px] lg:blur-none" : ""
          }`}
        >
          <header className="z-20 shrink-0 border-b border-slate-200/60 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/50 via-transparent to-white/30" />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center gap-1.5 pt-1.5">
              {[...Array(7)].map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full opacity-40"
                  style={{
                    backgroundColor: i % 3 === 0 ? "#1f5ce0" : i % 3 === 1 ? "#14b8a6" : "#a78bfa",
                    transform: `scale(${0.7 + (i % 3) * 0.15})`,
                  }}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-around gap-4 px-8 pb-0.5">
              <span className="h-1 w-12 max-w-[3rem] rounded-full bg-[#1f5ce0]/20" />
              <span className="h-1 w-8 rounded-full bg-[#14b8a6]/20" />
              <span className="h-1 w-10 rounded-full bg-[#a78bfa]/20" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen((prev) => !prev)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d8e3fb] bg-gradient-to-br from-white to-[#f5f8ff] text-[#2448a2] shadow-md shadow-slate-200/50 transition hover:border-[#1f5ce0]/40 hover:shadow-lg hover:shadow-[#1f5ce0]/10 lg:hidden"
                  aria-label="Open sidebar"
                >
                  {mobileSidebarOpen ? <FaXmark /> : <FaBars />}
                </button>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {activeView === "dashboard" ? "Dashboard" : "Settings"}
                  </h2>
                  <p className="flex items-center gap-1.5 text-sm text-slate-500">
                    <span className={`h-1 w-1 rounded-full ${activeView === "settings" ? "bg-[#0b6a86]" : "bg-emerald-500"}`} />
                    {activeView === "dashboard"
                      ? "Advanced Linktree pages manager"
                      : "TikTok Pixel & Events API"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2.5 rounded-full border-2 border-[#cfe0ff] bg-gradient-to-r from-[#eef4ff] to-[#e9fffa] px-4 py-2.5 text-sm font-medium text-[#3550a4] shadow-sm sm:inline-flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80">
                    <FaRegCalendarAlt className="text-[#1f5ce0]" />
                  </span>
                  <span className="tabular-nums">
                    {currentDate} · {currentTime}
                  </span>
                </div>
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    aria-label="Profile menu"
                    className="relative rounded-full transition hover:ring-2 hover:ring-[#1f5ce0]/30 hover:ring-offset-2"
                  >
                    <Image
                      src="/images/Logo.jpg"
                      alt={username}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden />
                  </button>
                  {profileMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[160px] overflow-hidden rounded-2xl border border-[#d7e2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] py-2 shadow-[0_18px_30px_rgba(63,82,148,0.18)]"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setProfileModalOpen(true);
                          setProfileMessage(null);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-[#eef4ff] hover:text-[#1f4fb3]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e0e9ff] text-[#1f5ce0]">
                          <FaRegUserCircle className="text-sm" />
                        </span>
                        Profile
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-70"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100">
                          <FaPowerOff className="text-sm text-rose-600" />
                        </span>
                        {loggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
            {activeView === "settings" ? (
              <SettingsView />
            ) : (
            <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Pages"
                value={formatNumber(totals.totalPages)}
                subtitle="All profiles"
                variant="blue"
              />
              <StatCard
                title="Total Views"
                value={formatNumber(totals.totalViews)}
                subtitle="+12.5% this week"
                variant="cyan"
              />
              <StatCard
                title="Total Clicks"
                value={formatNumber(totals.totalClicks)}
                subtitle="+8.2% conversion"
                variant="white"
              />
              <StatCard
                title="CTR"
                value={`${totals.ctr.toFixed(2)}%`}
                subtitle={`${totals.activeCount} active pages`}
                variant="mint"
              />
            </div>

            <section className="mt-4 rounded-[1.5rem] border border-[#d6e3ff] bg-[linear-gradient(165deg,#ffffff_0%,#f7fbff_65%,#f5fffa_100%)] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1f5ce0]" />
                  Page Control Center
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshDashboard}
                    disabled={refreshingDashboard}
                    className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-[#cfe0ff] bg-[#eef4ff] px-4 text-sm font-semibold text-[#1f5ce0] transition hover:border-[#a9bff7] hover:bg-[#e8efff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaArrowsRotate className={`text-xs ${refreshingDashboard ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearAnalyticsModalOpen(true)}
                    disabled={totals.totalViews === 0 && totals.totalClicks === 0}
                    className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaTrash className="text-xs text-rose-600" />
                    Clear All Analytics
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatePageModalOpen(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[linear-gradient(90deg,#7d3aed_0%,#2563eb_50%,#14b8a6_100%)] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(71,85,235,0.35)] hover:brightness-105"
                  >
                    <FaBolt className="text-xs" />
                    New Linktree Page
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_auto]">
                <label className="inline-flex h-11 items-center gap-2 rounded-full border border-[#d8e3fb] bg-[#f8fbff] px-4">
                  <FaMagnifyingGlass className="text-sm text-slate-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, description, URL"
                    className="w-full bg-transparent text-base text-slate-700 outline-none"
                  />
                </label>

                <FilterDropdown
                  icon={FaFilter}
                  value={statusFilter}
                  options={statusFilterOptions}
                  onChange={setStatusFilter}
                />

                <FilterDropdown
                  icon={FaArrowTrendUp}
                  value={sortBy}
                  options={sortOptions}
                  onChange={setSortBy}
                />

                <div className="inline-flex h-11 rounded-full border border-slate-300 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`inline-flex items-center gap-1 rounded-full px-3 text-sm font-semibold ${
                      viewMode === "grid" ? "bg-[#e8efff] text-[#1a43b6]" : "text-slate-600"
                    }`}
                  >
                    <FaTableList className="text-xs" />
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`inline-flex items-center gap-1 rounded-full px-3 text-sm font-semibold ${
                      viewMode === "list" ? "bg-[#e8efff] text-[#1a43b6]" : "text-slate-600"
                    }`}
                  >
                    <FaList className="text-xs" />
                    List
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                    setSortBy("updatedAt");
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#f8cfd6] bg-[#fff0f3] px-4 text-sm font-semibold text-[#a12a46] hover:bg-[#ffe2e8]"
                >
                  Reset
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-full border border-[#d2e2ff] bg-[linear-gradient(90deg,#eef4ff_0%,#eefdf8_100%)] px-4 py-2 text-sm text-slate-600">
                <p>
                  Showing <span className="font-semibold text-slate-800">{filteredPages.length}</span>{" "}
                  of <span className="font-semibold text-slate-800">{linktreePages.length}</span> pages
                </p>
                <p className="inline-flex items-center gap-1">
                  <FaRegClock className="text-xs" />
                  Last sync: 2 min ago
                </p>
              </div>

              <div className="mt-4">
                {filteredPages.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-[#d4e2ff] bg-[linear-gradient(180deg,#f5f9ff_0%,#f0fffa_100%)] p-8 text-center">
                    <p className="text-base font-semibold text-slate-800">No pages match your filters.</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search query or clear filters.
                    </p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {filteredPages.map((page) => (
                      <article
                        key={page.id}
                        className={`flex flex-col overflow-hidden rounded-[1.75rem] border-2 p-5 shadow-[0_8px_32px_rgba(31,92,224,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(31,92,224,0.15)] ${
                          page.id % 3 === 1
                            ? "border-[#d7e2ff] bg-gradient-to-br from-[#f8fbff] to-[#f0f7ff] hover:border-[#a9bff7]"
                            : page.id % 3 === 2
                              ? "border-[#cdebe3] bg-gradient-to-br from-[#f5fffb] to-[#ecfaf5] hover:border-[#9ad2c0]"
                              : "border-[#f2d9e8] bg-gradient-to-br from-[#fff8fc] to-[#fef2f7] hover:border-[#e4b8d6]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Image
                            src={page.profileImage}
                            alt={page.name}
                            width={52}
                            height={52}
                            className="h-14 w-14 shrink-0 rounded-full border-2 border-white/80 object-cover shadow-md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-base font-semibold text-slate-900">{page.name}</p>
                              <span
                                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass(page.status, page.isOfficial)}`}
                              >
                                {statusLabel(page.status, page.isOfficial)}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{page.description}</p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              Updated {formatDate(page.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2.5 shadow-sm">
                          <p className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">{page.pageUrl}</p>
                          <button
                            type="button"
                            onClick={() => copyLink(page)}
                            className="shrink-0 inline-flex h-8 items-center gap-1 rounded-full border border-[#ffd8a8] bg-[#fff7eb] px-3 text-xs font-medium text-[#9b5c00] transition hover:bg-[#ffefcf]"
                          >
                            <FaCopy className="text-[11px] text-[#9b5c00]" />
                            {copiedId === page.id ? "Copied" : "Copy"}
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                          <Metric title="Views" value={formatNumber(page.views)} />
                          <Metric title="Clicks" value={formatNumber(page.clicks)} />
                        </div>

                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Expiry Health</span>
                            <span>
                              {page.isOfficial
                                ? "Never expires"
                                : daysUntil(page.expiresAt) <= 0
                                  ? "Expired"
                                  : `${daysUntil(page.expiresAt)} days left`}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200/80">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                page.isOfficial
                                  ? "bg-[#0b6a86]"
                                  : page.status === "expired"
                                    ? "bg-rose-500"
                                    : page.status === "expires_soon"
                                      ? "bg-[#1f5ce0]"
                                      : "bg-[#0b6a86]"
                              }`}
                              style={{ width: page.isOfficial ? "100%" : `${expiryProgress(page.expiresAt)}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-auto flex w-full items-center gap-2 pt-5">
                          <button
                            type="button"
                            onClick={() => setViewPage(page)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-3 py-2.5 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                          >
                            <FaEye className="text-xs text-sky-600" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPage(page)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <FaPencil className="text-xs text-indigo-600" />
                            Edit
                          </button>
                          {!page.isOfficial ? (
                            <button
                              type="button"
                              onClick={() => setDeletePage(page)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                            >
                              <FaTrash className="text-xs text-rose-600" />
                              Delete
                            </button>
                          ) : (
                            <span className="flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-400" title="Official page cannot be deleted">
                              Protected
                            </span>
                          )}
                          <a
                            href={page.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open page"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-500 text-white transition hover:bg-emerald-600"
                          >
                            <FaArrowUpRightFromSquare className="text-sm" />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#d4e0ff]">
                    <div className="hidden grid-cols-[1.2fr_0.55fr_0.45fr_0.45fr_0.8fr_0.65fr] gap-2 bg-[linear-gradient(90deg,#eef4ff_0%,#ecfff8_100%)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 md:grid">
                      <span>Page</span>
                      <span>Status</span>
                      <span>Views</span>
                      <span>Clicks</span>
                      <span>Expiry</span>
                      <span>Actions</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {filteredPages.map((page) => (
                        <div
                          key={page.id}
                          className={`grid gap-2 px-3 py-3 md:grid-cols-[1.2fr_0.55fr_0.45fr_0.45fr_0.8fr_0.65fr] md:items-center ${
                            page.id % 2 === 0 ? "bg-[#f8fffb]" : "bg-[#f8faff]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-900">{page.name}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <p className="min-w-0 truncate text-sm text-slate-500">{page.pageUrl}</p>
                              <button
                                type="button"
                                onClick={() => copyLink(page)}
                                className="shrink-0 inline-flex h-7 items-center gap-1 rounded-full border border-[#ffd8a8] bg-[#fff7eb] px-3 text-xs font-medium text-[#9b5c00] hover:bg-[#ffefcf]"
                              >
                                <FaCopy className="text-[11px] text-[#9b5c00]" />
                                {copiedId === page.id ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(page.status, page.isOfficial)}`}
                          >
                            {statusLabel(page.status, page.isOfficial)}
                          </span>
                          <span className="text-base text-slate-700">{formatNumber(page.views)}</span>
                          <span className="text-base text-slate-700">{formatNumber(page.clicks)}</span>
                          <span className="text-base text-slate-700">{page.isOfficial ? "Never" : formatDate(page.expiresAt)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewPage(page)}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-3 text-xs font-medium text-sky-700 hover:bg-sky-100"
                            >
                              <FaEye className="text-[11px] text-sky-600" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditPage(page)}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-3 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                            >
                              <FaPencil className="text-[11px] text-indigo-600" />
                              Edit
                            </button>
                            {!page.isOfficial ? (
                              <button
                                type="button"
                                onClick={() => setDeletePage(page)}
                                className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 text-xs font-medium text-rose-700 hover:bg-rose-100"
                              >
                                <FaTrash className="text-[11px] text-rose-600" />
                                Delete
                              </button>
                            ) : null}
                            <a
                              href={page.pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open page"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-500 text-white transition hover:bg-emerald-600"
                            >
                              <FaArrowUpRightFromSquare className="text-[11px]" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
            </>
            )}
          </section>
        </div>
      </section>

      {profileModalOpen ? (
        <ProfileModal
          username={username}
          activeTab={profileTab}
          onTabChange={setProfileTab}
          message={profileMessage}
          onClose={() => {
            setProfileModalOpen(false);
            setProfileMessage(null);
          }}
          onSuccess={(type) => {
            setProfileMessage({ type: "success", text: type === "password" ? "Password updated successfully." : "Username updated successfully." });
            router.refresh();
          }}
          onError={(text) => setProfileMessage({ type: "error", text })}
          onClearMessage={() => setProfileMessage(null)}
        />
      ) : null}

      {createPageModalOpen ? (
        <CreateLinktreeModal
          existingPages={linktreePages}
          onClose={() => setCreatePageModalOpen(false)}
          onSubmit={(page) => {
            setLinktreePages((prev) => [...prev, page]);
            setCreatePageModalOpen(false);
          }}
        />
      ) : null}

      {editPage ? (
        <EditLinktreeModal
          page={editPage}
          onClose={() => setEditPage(null)}
          onSuccess={(updated) => {
            setLinktreePages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            if (viewPage?.id === updated.id) setViewPage(updated);
            setEditPage(null);
          }}
        />
      ) : null}

      <DeleteModal
        open={deletePage !== null}
        onClose={() => setDeletePage(null)}
        onConfirm={async () => {
          if (!deletePage || deletePage.isOfficial) return;
          const res = await fetch(`/api/admin/pages/${deletePage.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setLinktreePages((prev) => prev.filter((p) => p.id !== deletePage.id));
            if (viewPage?.id === deletePage.id) setViewPage(null);
          }
        }}
        title="Delete Linktree Page"
        message="This will permanently remove the page and its links. This action cannot be undone."
        itemName={deletePage?.name}
      />

      <DeleteModal
        open={clearAnalyticsModalOpen}
        onClose={() => setClearAnalyticsModalOpen(false)}
        onConfirm={async () => {
          const res = await fetch("/api/admin/pages/analytics/clear-all", {
            method: "PATCH",
          });
          if (res.ok) {
            setLinktreePages((prev) =>
              prev.map((page) => ({ ...page, views: 0, clicks: 0 }))
            );
            setViewPage((p) => (p ? { ...p, views: 0, clicks: 0 } : null));
          }
        }}
        title="Clear All Analytics"
        message="This will reset views and clicks to zero for all pages. This action cannot be undone."
        confirmLabel="Clear All"
      />

      {viewPage ? (
        <ViewAnalyticsModal
          page={viewPage}
          onClose={() => setViewPage(null)}
          onRefresh={async () => {
            const data = await loadPages();
            if (viewPage) {
              const updated = data.find((x) => x.id === viewPage.id);
              if (updated) setViewPage(updated);
            }
            router.refresh();
          }}
          onClear={async () => {
            const res = await fetch(`/api/admin/pages/${viewPage.id}/analytics`, {
              method: "PATCH",
            });
            if (res.ok) {
              setLinktreePages((prev) =>
                prev.map((p) => (p.id === viewPage.id ? { ...p, views: 0, clicks: 0 } : p))
              );
              setViewPage((p) => (p ? { ...p, views: 0, clicks: 0 } : null));
            }
          }}
        />
      ) : null}
    </main>
  );
}

function ViewAnalyticsModal({
  page,
  onClose,
  onRefresh,
  onClear,
}: {
  page: LinktreePage;
  onClose: () => void;
  onRefresh: () => void;
  onClear: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [linkClicks, setLinkClicks] = useState<Array<{ platformId: string; clicks: number }>>([]);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/pages/${page.id}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { links?: Array<{ platformId: string; clicks: number }> };
        if (cancelled) return;
        const list = (data.links ?? [])
          .filter((l) => l.clicks > 0)
          .map((l) => ({ platformId: l.platformId, clicks: l.clicks }))
          .sort((a, b) => b.clicks - a.clicks);
        setLinkClicks(list);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [page.id, fetchKey]);

  const platformClicks =
    linkClicks.length > 0 ? linkClicks : getPlatformClicks(page.clicks);
  const ctr = page.views > 0 ? ((page.clicks / page.views) * 100).toFixed(2) : "0";

  async function handleRefresh() {
    setRefreshing(true);
    onRefresh();
    setFetchKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 400));
    setRefreshing(false);
  }

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-analytics-title"
    >
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#d7e2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#d7e2f8] bg-[linear-gradient(90deg,#eef4ff_0%,#f0f9ff_100%)] px-5 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src={page.profileImage}
                alt={page.name}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-md"
              />
              <div className="min-w-0">
                <h2 id="view-analytics-title" className="truncate text-lg font-bold text-slate-900">
                  {page.name}
                </h2>
                <p className="truncate text-sm text-slate-500">{page.pageUrl}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Refresh data"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-[#e2e8f0] hover:text-slate-800 disabled:opacity-50"
                title="Refresh data"
              >
                <FaArrowsRotate className={`text-sm ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear analytics"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                title="Clear analytics"
              >
                <FaTrash className="text-sm" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <FaXmark className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#d4e2ff] bg-[#f0f7ff] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Views</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(page.views)}</p>
            </div>
            <div className="rounded-xl border border-[#cdebe3] bg-[#ecfaf5] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clicks</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(page.clicks)}</p>
            </div>
            <div className="rounded-xl border border-[#e2d9f0] bg-[#f5f3ff] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">CTR</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{ctr}%</p>
            </div>
          </div>

          {platformClicks.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                Most Clicked Platforms
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {platformClicks.map(({ platformId, clicks }) => {
                  const cfg = PLATFORM_CONFIG[platformId];
                  const Icon = cfg.icon;
                  const pct = page.clicks > 0 ? ((clicks / page.clicks) * 100).toFixed(0) : "0";
                  return (
                    <div
                      key={platformId}
                      className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: cfg.color }}
                      >
                        <Icon className="text-sm" />
                      </span>
                      <span className="text-sm font-medium text-slate-800">{cfg.label}</span>
                      <span className="text-base font-bold text-slate-900">{formatNumber(clicks)}</span>
                      <span className="text-sm text-slate-400">({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[#d4e2ff] bg-[#f8fbff] px-4 py-4 text-center text-sm text-slate-500">
              No platform click data yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateLinktreeModal({
  existingPages,
  onClose,
  onSubmit,
}: {
  existingPages: LinktreePage[];
  onClose: () => void;
  onSubmit: (page: LinktreePage) => void;
}) {
  const [tab, setTab] = useState<1 | 2 | 3>(1);
  const [profileImage, setProfileImage] = useState<string>("/images/DefaultAvatar.png");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە");
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  });
  const [sponsorName, setSponsorName] = useState(() => {
    if (typeof window === "undefined") return "Wafaye Sponsor";
    return localStorage.getItem(DEFAULT_SPONSOR_KEY) || "Wafaye Sponsor";
  });
  const [sponsorPhone, setSponsorPhone] = useState("+9647509516125");
  const [hideFooter, setHideFooter] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([]);
  const [platformInstances, setPlatformInstances] = useState<Array<{ id: number; platformId: PlatformId }>>([]);
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [defaultMessages, setDefaultMessages] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_MESSAGE_PLATFORMS: PlatformId[] = ["whatsapp", "telegram", "viber"];
  const IRAQ_PHONE_PLATFORMS: PlatformId[] = ["whatsapp", "viber", "phone"];
  const nextInstanceIdRef = useRef(1);

  const inputClass = "w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-[#1b49d0] focus:ring-2 focus:ring-[#c8d6ff]";

  function slugify(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function getUniqueSlug(base: string): string {
    const normalizedBase = base || "page";
    const taken = new Set(existingPages.map((page) => slugify(page.name)));
    if (!taken.has(normalizedBase)) {
      return normalizedBase;
    }

    let index = 2;
    while (taken.has(`${normalizedBase}-${index}`)) {
      index += 1;
    }
    return `${normalizedBase}-${index}`;
  }

  const uniqueSeoSlug = getUniqueSlug(slugify(name || "untitled-page"));
  const baseUrl =
    (typeof window !== "undefined" ? window.location.origin : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  const seoPageUrl = baseUrl ? `${baseUrl}/p/${uniqueSeoSlug}` : `/p/${uniqueSeoSlug}`;

  function togglePlatform(id: PlatformId) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function addPlatformInstance(platformId: PlatformId) {
    setPlatformInstances((prev) => [
      ...prev,
      { id: nextInstanceIdRef.current++, platformId },
    ]);
  }

  function removePlatformInstance(instanceId: number, platformId: PlatformId) {
    setPlatformInstances((prev) => {
      const nextInstances = prev.filter((instance) => instance.id !== instanceId);
      const hasAnother = nextInstances.some((instance) => instance.platformId === platformId);
      if (!hasAnother) {
        setSelectedPlatforms((selectedPrev) => selectedPrev.filter((id) => id !== platformId));
      }
      return nextInstances;
    });
    setLinkValues((prev) => {
      const next = { ...prev };
      delete next[String(instanceId)];
      return next;
    });
    setCustomLabels((prev) => {
      const next = { ...prev };
      delete next[String(instanceId)];
      return next;
    });
    setDefaultMessages((prev) => {
      const next = { ...prev };
      delete next[String(instanceId)];
      return next;
    });
  }

  function movePlatformInstance(instanceId: number, direction: "up" | "down") {
    setPlatformInstances((prev) => {
      const index = prev.findIndex((instance) => instance.id === instanceId);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function createPage() {
    const today = new Date();
    const defaultExpiry = new Date(today);
    defaultExpiry.setDate(defaultExpiry.getDate() + 10);
    const expiry = expiresAt ? new Date(`${expiresAt}T00:00:00`) : defaultExpiry;
    const expiresAtStr = expiry.toISOString().slice(0, 10);
    const profilePath = profileImage.startsWith("/") ? profileImage : "/images/DefaultAvatar.png";

    const links = platformInstances
      .map((inst, i) => {
        const val = linkValues[String(inst.id)]?.trim();
        if (!val) return null;
        const label = inst.platformId === "custom" ? customLabels[String(inst.id)]?.trim() : undefined;
        const defaultMessage = DEFAULT_MESSAGE_PLATFORMS.includes(inst.platformId)
          ? defaultMessages[String(inst.id)]?.trim()
          : undefined;
        return {
          platformId: inst.platformId,
          value: val,
          label: label || undefined,
          defaultMessage: defaultMessage || undefined,
          sort_order: i,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Untitled Page",
          description: description.trim() || "",
          profileImage: profilePath,
          expiresAt: expiresAtStr,
          showFooter: !hideFooter,
          sponsorName: sponsorName.trim() || "Wafaye Sponsor",
          sponsorPhone: sponsorPhone.trim() || null,
          links: links.map(({ platformId, value, label, defaultMessage }) => ({
            platformId,
            value,
            label,
            defaultMessage,
          })),
        }),
      });
      const data = (await res.json().catch(() => null)) as LinktreePage | { error?: string };
      if (!res.ok) {
        setCreateError(typeof data === "object" && data && "error" in data ? data.error : "Failed to create page");
        return;
      }
      onSubmit(data as LinktreePage);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    setPlatformInstances((prev) => {
      const filtered = prev.filter((instance) => selectedPlatforms.includes(instance.platformId));
      const next = [...filtered];
      for (const id of selectedPlatforms) {
        if (!next.some((instance) => instance.platformId === id)) {
          next.push({ id: nextInstanceIdRef.current++, platformId: id });
        }
      }
      return next;
    });
  }, [selectedPlatforms]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-page-title"
        className="relative flex w-full max-w-xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-[#d7e2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <header className="shrink-0 border-b border-[#d7e2f8] bg-[linear-gradient(90deg,#f0f5ff_0%,#f8fffe_100%)] px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 id="create-page-title" className="text-lg font-bold text-slate-900">Create Linktree Page</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700">
              <FaXmark className="text-base" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            {([1, 2, 3] as const).map((t) => (
              <span key={t} className="flex items-center gap-0.5">
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    tab === t ? "bg-[#1f5ce0] text-white" : tab > t ? "bg-[#1f5ce0]/30 text-[#1f5ce0]" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {t}
                </span>
                <span className={`hidden text-[10px] font-medium sm:inline ${tab >= t ? "text-slate-600" : "text-slate-400"}`}>
                  {t === 1 && "Setup"}
                  {t === 2 && "Platforms"}
                  {t === 3 && "Links"}
                </span>
                {t < 3 ? <span className="mx-0.5 text-xs text-slate-300">›</span> : null}
              </span>
            ))}
          </div>
        </header>

        {/* Scrollable content */}
        <form onSubmit={(e) => e.preventDefault()} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-2">
            {tab === 1 && (
              <div className="relative space-y-4 px-1 py-1">
                <div className="pointer-events-none absolute -right-8 -top-6 h-20 w-20 rounded-full bg-[#1f5ce0]/8 blur-2xl" />
                <div className="pointer-events-none absolute -left-8 bottom-8 h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="pointer-events-none absolute right-2 top-2 grid grid-cols-4 gap-1 opacity-25">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-full bg-[#9aaed8]" />
                  ))}
                </div>
                <div className="pointer-events-none h-1 rounded-full bg-[linear-gradient(90deg,#d9e7ff_0%,#d9f6eb_100%)]" />

                <div className="flex flex-col items-center gap-3 text-center">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#d7e2f8] bg-slate-100 transition hover:border-[#1f5ce0]"
                    aria-label="Upload profile image"
                  >
                    <Image src={profileImage} alt="Profile preview" fill className="object-cover" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="inline-flex items-center gap-2 rounded-full border border-[#1f5ce0] bg-[#1f5ce0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4fc9]"
                  >
                    <FaImage className="text-xs" />
                    Upload Image
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Page name" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Short description" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">SEO URL (read-only)</span>
                    <input type="text" value={seoPageUrl} disabled readOnly className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`} title="Page URL for SEO - generated from name" />
                  </label>
                  <ExpireDatePicker value={expiresAt} onChange={setExpiresAt} label="Expire date" />
                </div>

                <div className="flex items-center justify-between rounded-full border border-[#d0d7e2] bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">Show footer</p>
                  <button
                    type="button"
                    onClick={() => setHideFooter((prev) => !prev)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                      hideFooter ? "bg-slate-300" : "bg-[#1f5ce0]"
                    }`}
                    aria-pressed={!hideFooter}
                    aria-label={hideFooter ? "Footer hidden" : "Footer visible"}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white transition ${
                        hideFooter ? "translate-x-1" : "translate-x-6"
                      }`}
                    />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Sponsor name</span>
                    <input
                    type="text"
                    value={sponsorName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSponsorName(v);
                      if (typeof window !== "undefined") localStorage.setItem(DEFAULT_SPONSOR_KEY, v || "Wafaye Sponsor");
                    }}
                    className={inputClass}
                    placeholder="Wafaye Sponsor"
                  />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Sponsor phone</span>
                    <input type="tel" value={sponsorPhone} onChange={(e) => setSponsorPhone(e.target.value)} className={inputClass} placeholder="+964750123456" />
                  </label>
                </div>
              </div>
            )}

            {tab === 2 && (
              <div className="relative space-y-4 px-1 py-1">
                <div className="pointer-events-none absolute -right-8 -top-6 h-20 w-20 rounded-full bg-[#1f5ce0]/8 blur-2xl" />
                <div className="pointer-events-none absolute -left-8 bottom-8 h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="pointer-events-none absolute right-2 top-2 grid grid-cols-4 gap-1 opacity-25">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-full bg-[#9aaed8]" />
                  ))}
                </div>
                <div className="pointer-events-none h-1 rounded-full bg-[linear-gradient(90deg,#d9e7ff_0%,#d9f6eb_100%)]" />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">Select platforms to add</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <FaCircleCheck className="text-sm" />
                    {selectedPlatforms.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PLATFORM_CONFIG) as PlatformId[]).map((id, index) => {
                  const cfg = PLATFORM_CONFIG[id];
                  const Icon = cfg.icon;
                  const checked = selectedPlatforms.includes(id);
                  const brandStyle = PLATFORM_BUTTON_STYLE[id];
                  const variantClass =
                    index % 3 === 0
                      ? "bg-[#f9fbff]"
                      : index % 3 === 1
                        ? "bg-[#f8fbff]"
                        : "bg-[#f9fcfb]";
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePlatform(id)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-all ${variantClass} ${
                        checked
                          ? "border-emerald-300 bg-[#f8fafc] shadow-[0_8px_18px_rgba(15,23,42,0.08)] ring-1 ring-emerald-200"
                          : "border-[#d0d7e2] bg-[#f8fafc] hover:border-[#b9c4d4] hover:bg-[#f4f7fb]"
                      }`}
                    >
                      {checked ? (
                        <span className="absolute right-1.5 top-1.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                          <FaCheck className="text-[9px]" />
                        </span>
                      ) : null}
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-[0_5px_12px_rgba(0,0,0,0.12)]"
                        style={{ backgroundImage: brandStyle.iconGradient, color: brandStyle.iconColor }}
                      >
                        <Icon className="text-base" />
                      </span>
                      <span className="text-[12px] font-semibold leading-tight text-slate-900">
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

            {tab === 3 && (
              <div className="relative space-y-4 px-1 py-1">
                <div className="pointer-events-none absolute -right-8 -top-6 h-20 w-20 rounded-full bg-[#1f5ce0]/8 blur-2xl" />
                <div className="pointer-events-none absolute -left-8 bottom-8 h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="pointer-events-none h-1 rounded-full bg-[linear-gradient(90deg,#d9e7ff_0%,#d9f6eb_100%)]" />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">Set input for selected platforms</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe4f8] bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#3157b0]">
                    {platformInstances.length} items
                  </span>
                </div>
                {platformInstances.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#d4e2ff] bg-[#f5f9ff] p-8 text-center text-sm text-slate-600">Select platforms in the previous step first.</p>
                ) : (
                  <div className="max-h-[28rem] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-3">
                    {platformInstances.map((instance, index) => {
                      const id = instance.platformId;
                      const cfg = PLATFORM_CONFIG[id];
                      const Icon = cfg.icon;
                      const value = linkValues[String(instance.id)] ?? "";
                      const isCustom = id === "custom";
                      return (
                        <div key={instance.id} className="rounded-2xl border border-[#d7e2f8] bg-white p-4 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: cfg.color }}>
                              <Icon className="text-sm" />
                            </span>
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-800">{cfg.label}</span>
                              <span className="block text-[11px] text-slate-500">
                                {cfg.type === "phone"
                                  ? "Enter phone number"
                                  : cfg.type === "username"
                                    ? "Enter username only"
                                    : cfg.type === "url"
                                      ? "Enter full URL"
                                      : "Enter custom value"}
                              </span>
                            </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => movePlatformInstance(instance.id, "up")}
                                disabled={index === 0}
                                className="rounded-full border border-[#d7e2f8] bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Move up"
                              >
                                <FaArrowUp className="text-[10px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => movePlatformInstance(instance.id, "down")}
                                disabled={index === platformInstances.length - 1}
                                className="rounded-full border border-[#d7e2f8] bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Move down"
                              >
                                <FaArrowDown className="text-[10px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => addPlatformInstance(id)}
                                className="rounded-full border border-[#cfe0ff] bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#244ea8] hover:bg-[#e5eeff]"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => removePlatformInstance(instance.id, id)}
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {isCustom ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={customLabels[String(instance.id)] ?? ""}
                                onChange={(e) =>
                                  setCustomLabels((p) => ({ ...p, [String(instance.id)]: e.target.value }))
                                }
                                className={inputClass}
                                placeholder="Link label"
                              />
                              <input
                                type="url"
                                value={value}
                                onChange={(e) =>
                                  setLinkValues((p) => ({ ...p, [String(instance.id)]: e.target.value }))
                                }
                                className={inputClass}
                                placeholder={cfg.placeholder}
                              />
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {cfg.prefix ? (
                                <p className="text-[11px] text-slate-500">
                                  Prefix: <span className="font-medium text-slate-700">{cfg.prefix}</span>
                                </p>
                              ) : null}
                              {IRAQ_PHONE_PLATFORMS.includes(id) ? (
                                <p className="text-[11px] text-slate-500">
                                  +964 (Iraq) added automatically
                                </p>
                              ) : null}
                              <input
                                type={cfg.type === "phone" ? "tel" : cfg.type === "url" ? "url" : "text"}
                                value={value}
                                onChange={(e) =>
                                  setLinkValues((p) => ({ ...p, [String(instance.id)]: e.target.value }))
                                }
                                className={inputClass}
                                placeholder={cfg.placeholder}
                              />
                              {DEFAULT_MESSAGE_PLATFORMS.includes(id) ? (
                                <div className="mt-2">
                                  <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                    Default message (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={defaultMessages[String(instance.id)] ?? ""}
                                    onChange={(e) =>
                                      setDefaultMessages((p) => ({
                                        ...p,
                                        [String(instance.id)]: e.target.value,
                                      }))
                                    }
                                    className={inputClass}
                                    placeholder="e.g. Hi! I'm interested in your sponsor services."
                                  />
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <footer className="shrink-0 border-t border-[#d7e2f8] bg-white px-6 py-3">
            {createError ? (
              <p className="mb-3 text-sm text-rose-600">{createError}</p>
            ) : null}
            <div className="flex gap-3">
              {tab > 1 ? (
                <button type="button" onClick={() => setTab((t) => (t - 1) as 1 | 2 | 3)} disabled={creating} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Back
                </button>
              ) : null}
              {tab < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (tab === 1 && !name.trim()) return;
                    setTab((t) => (t + 1) as 1 | 2 | 3);
                  }}
                  disabled={tab === 1 && !name.trim()}
                  className="ml-auto rounded-full bg-[#1f5ce0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4fc9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={createPage}
                  disabled={creating}
                  className="ml-auto flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#7d3aed_0%,#14b8a6_100%)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {creating ? (
                    <>
                      <FaArrowsRotate className="h-3.5 w-3.5 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create Page"
                  )}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

type PageWithLinks = LinktreePage & {
  links: Array<{ platformId: string; value: string; label?: string | null; defaultMessage?: string | null }>;
  showFooter?: boolean;
  sponsorName?: string;
  sponsorPhone?: string | null;
};

function EditLinktreeModal({
  page,
  onClose,
  onSuccess,
}: {
  page: LinktreePage;
  onClose: () => void;
  onSuccess: (updated: LinktreePage) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullPage, setFullPage] = useState<PageWithLinks | null>(null);

  const [tab, setTab] = useState<1 | 2 | 3>(1);
  const [profileImage, setProfileImage] = useState<string>("/images/DefaultAvatar.png");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sponsorName, setSponsorName] = useState(() => {
    if (typeof window === "undefined") return "Wafaye Sponsor";
    return localStorage.getItem(DEFAULT_SPONSOR_KEY) || "Wafaye Sponsor";
  });
  const [sponsorPhone, setSponsorPhone] = useState("+9647509516125");
  const [hideFooter, setHideFooter] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([]);
  const [platformInstances, setPlatformInstances] = useState<Array<{ id: number; platformId: PlatformId }>>([]);
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [defaultMessages, setDefaultMessages] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextInstanceIdRef = useRef(1);

  const DEFAULT_MESSAGE_PLATFORMS: PlatformId[] = ["whatsapp", "telegram", "viber"];
  const IRAQ_PHONE_PLATFORMS: PlatformId[] = ["whatsapp", "viber", "phone"];
  const inputClass = "w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-[#1b49d0] focus:ring-2 focus:ring-[#c8d6ff]";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/pages/${page.id}`);
        if (!res.ok) {
          setError("Failed to load page");
          return;
        }
        const data = (await res.json()) as PageWithLinks;
        if (cancelled) return;

        setFullPage(data);
        setProfileImage(data.profileImage || "/images/DefaultAvatar.png");
        setName(data.name || "");
        setDescription(data.description || "");
        setExpiresAt(data.expiresAt || "");
        setHideFooter(data.showFooter === false);
        setSponsorName(data.sponsorName || "Wafaye Sponsor");
        setSponsorPhone(data.sponsorPhone ?? "");

        const links = data.links || [];
        const platforms = [...new Set(links.map((l) => l.platformId as PlatformId))];
        setSelectedPlatforms(platforms);

        const instances: Array<{ id: number; platformId: PlatformId }> = [];
        const values: Record<string, string> = {};
        const labels: Record<string, string> = {};
        const msgs: Record<string, string> = {};

        links.forEach((link, i) => {
          const id = nextInstanceIdRef.current++;
          instances.push({ id, platformId: link.platformId as PlatformId });
          const raw = link.value || "";
          values[String(id)] = IRAQ_PHONE_PLATFORMS.includes(link.platformId as PlatformId)
            ? formatIraqPhoneForInput(raw)
            : raw;
          if (link.platformId === "custom" && link.label) labels[String(id)] = link.label;
          if (DEFAULT_MESSAGE_PLATFORMS.includes(link.platformId as PlatformId) && link.defaultMessage) {
            msgs[String(id)] = link.defaultMessage;
          }
        });

        setPlatformInstances(instances);
        setLinkValues(values);
        setCustomLabels(labels);
        setDefaultMessages(msgs);
      } catch {
        if (!cancelled) setError("Failed to load page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page.id]);

  function addPlatformInstance(platformId: PlatformId) {
    setPlatformInstances((prev) => [...prev, { id: nextInstanceIdRef.current++, platformId }]);
  }

  function removePlatformInstance(instanceId: number, platformId: PlatformId) {
    setPlatformInstances((prev) => {
      const nextInstances = prev.filter((instance) => instance.id !== instanceId);
      const hasAnother = nextInstances.some((instance) => instance.platformId === platformId);
      if (!hasAnother) {
        setSelectedPlatforms((selectedPrev) => selectedPrev.filter((id) => id !== platformId));
      }
      return nextInstances;
    });
    setLinkValues((prev) => { const n = { ...prev }; delete n[String(instanceId)]; return n; });
    setCustomLabels((prev) => { const n = { ...prev }; delete n[String(instanceId)]; return n; });
    setDefaultMessages((prev) => { const n = { ...prev }; delete n[String(instanceId)]; return n; });
  }

  function movePlatformInstance(instanceId: number, direction: "up" | "down") {
    setPlatformInstances((prev) => {
      const index = prev.findIndex((instance) => instance.id === instanceId);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  function togglePlatform(id: PlatformId) {
    setSelectedPlatforms((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      setPlatformInstances((insts) => {
        const filtered = insts.filter((i) => next.includes(i.platformId));
        const result = [...filtered];
        for (const pid of next) {
          if (!result.some((i) => i.platformId === pid)) {
            result.push({ id: nextInstanceIdRef.current++, platformId: pid });
          }
        }
        return result;
      });
      return next;
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function savePage() {
    const profilePath = profileImage.startsWith("/") ? profileImage : "/images/DefaultAvatar.png";
    const links = platformInstances
      .map((inst, i) => {
        const val = linkValues[String(inst.id)]?.trim();
        if (!val) return null;
        const label = inst.platformId === "custom" ? customLabels[String(inst.id)]?.trim() : undefined;
        const defaultMessage = DEFAULT_MESSAGE_PLATFORMS.includes(inst.platformId)
          ? defaultMessages[String(inst.id)]?.trim()
          : undefined;
        return {
          platformId: inst.platformId,
          value: val,
          label: label || undefined,
          defaultMessage: defaultMessage || undefined,
          sort_order: i,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Untitled Page",
          description: description.trim() || "",
          profileImage: profilePath,
          expiresAt: expiresAt || new Date().toISOString().slice(0, 10),
          showFooter: !hideFooter,
          sponsorName: sponsorName.trim() || "Wafaye Sponsor",
          sponsorPhone: sponsorPhone.trim() || null,
          links: links.map(({ platformId, value, label, defaultMessage }) => ({
            platformId,
            value,
            label,
            defaultMessage,
          })),
        }),
      });
      const data = (await res.json().catch(() => null)) as LinktreePage | { error?: string };
      if (!res.ok) {
        setSaveError(typeof data === "object" && data && "error" in data ? data.error : "Failed to update page");
        return;
      }
      onSuccess(data as LinktreePage);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
        <div className="relative flex h-32 items-center justify-center rounded-2xl border border-[#d7e2f8] bg-white px-12 shadow-lg">
          <FaArrowsRotate className="h-8 w-8 animate-spin text-[#1f5ce0]" />
        </div>
      </div>
    );
  }

  if (error || !fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
        <div className="relative rounded-2xl border border-rose-200 bg-white p-6 shadow-lg">
          <p className="text-slate-700">{error || "Page not found"}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-page-title"
        className="relative flex w-full max-w-xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-[#d7e2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-[#d7e2f8] bg-[linear-gradient(90deg,#f0f5ff_0%,#f8fffe_100%)] px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 id="edit-page-title" className="text-lg font-bold text-slate-900">Edit Linktree Page</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700">
              <FaXmark className="text-base" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            {([1, 2, 3] as const).map((t) => (
              <span key={t} className="flex items-center gap-0.5">
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    tab === t ? "bg-[#1f5ce0] text-white" : tab > t ? "bg-[#1f5ce0]/30 text-[#1f5ce0]" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {t}
                </span>
                <span className={`hidden text-[10px] font-medium sm:inline ${tab >= t ? "text-slate-600" : "text-slate-400"}`}>
                  {t === 1 && "Setup"}
                  {t === 2 && "Platforms"}
                  {t === 3 && "Links"}
                </span>
                {t < 3 ? <span className="mx-0.5 text-xs text-slate-300">›</span> : null}
              </span>
            ))}
          </div>
        </header>

        <form onSubmit={(e) => e.preventDefault()} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-2">
            {tab === 1 && (
              <div className="relative space-y-4 px-1 py-1">
                <div className="flex flex-col items-center gap-3 text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#d7e2f8] bg-slate-100 transition hover:border-[#1f5ce0]"
                    aria-label="Upload profile image"
                  >
                    <Image src={profileImage} alt="Profile preview" fill className="object-cover" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-[#1f5ce0] bg-[#1f5ce0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4fc9]">
                    <FaImage className="text-xs" />
                    Upload Image
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Page name" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Short description" />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">SEO URL (read-only)</span>
                    <input type="text" value={fullPage?.pageUrl ?? ""} disabled readOnly className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`} title="Page URL for SEO" />
                  </label>
                  {fullPage?.isOfficial ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Expire date</span>
                      <input type="text" value="Never expires" disabled readOnly className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`} />
                    </label>
                  ) : (
                    <ExpireDatePicker value={expiresAt} onChange={setExpiresAt} label="Expire date" />
                  )}
                </div>
                <div className="flex items-center justify-between rounded-full border border-[#d0d7e2] bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">Show footer</p>
                  <button
                    type="button"
                    onClick={() => setHideFooter((prev) => !prev)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${hideFooter ? "bg-slate-300" : "bg-[#1f5ce0]"}`}
                    aria-pressed={!hideFooter}
                  >
                    <span className={`h-5 w-5 rounded-full bg-white transition ${hideFooter ? "translate-x-1" : "translate-x-6"}`} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Sponsor name</span>
                    <input type="text" value={sponsorName} onChange={(e) => { const v = e.target.value; setSponsorName(v); if (typeof window !== "undefined") localStorage.setItem(DEFAULT_SPONSOR_KEY, v || "Wafaye Sponsor"); }} className={inputClass} placeholder="Wafaye Sponsor" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Sponsor phone</span>
                    <input type="tel" value={sponsorPhone} onChange={(e) => setSponsorPhone(e.target.value)} className={inputClass} placeholder="+964750123456" />
                  </label>
                </div>
              </div>
            )}

            {tab === 2 && (
              <div className="relative space-y-4 px-1 py-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">Select platforms to add</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <FaCircleCheck className="text-sm" />
                    {selectedPlatforms.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PLATFORM_CONFIG) as PlatformId[]).map((id, index) => {
                    const cfg = PLATFORM_CONFIG[id];
                    const Icon = cfg.icon;
                    const checked = selectedPlatforms.includes(id);
                    const brandStyle = PLATFORM_BUTTON_STYLE[id];
                    const variantClass = index % 3 === 0 ? "bg-[#f9fbff]" : index % 3 === 1 ? "bg-[#f8fbff]" : "bg-[#f9fcfb]";
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => togglePlatform(id)}
                        className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-all ${variantClass} ${
                          checked ? "border-emerald-300 bg-[#f8fafc] shadow-[0_8px_18px_rgba(15,23,42,0.08)] ring-1 ring-emerald-200" : "border-[#d0d7e2] bg-[#f8fafc] hover:border-[#b9c4d4] hover:bg-[#f4f7fb]"
                        }`}
                      >
                        {checked ? <span className="absolute right-1.5 top-1.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"><FaCheck className="text-[9px]" /></span> : null}
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-[0_5px_12px_rgba(0,0,0,0.12)]" style={{ backgroundImage: brandStyle.iconGradient, color: brandStyle.iconColor }}>
                          <Icon className="text-base" />
                        </span>
                        <span className="text-[12px] font-semibold leading-tight text-slate-900">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 3 && (
              <div className="relative space-y-4 px-1 py-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">Set input for selected platforms</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe4f8] bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#3157b0]">
                    {platformInstances.length} items
                  </span>
                </div>
                {platformInstances.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#d4e2ff] bg-[#f5f9ff] p-8 text-center text-sm text-slate-600">Select platforms in the previous step first.</p>
                ) : (
                  <div className="max-h-[28rem] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-3">
                    {platformInstances.map((instance, index) => {
                      const id = instance.platformId;
                      const cfg = PLATFORM_CONFIG[id];
                      const Icon = cfg.icon;
                      const value = linkValues[String(instance.id)] ?? "";
                      const isCustom = id === "custom";
                      return (
                        <div key={instance.id} className="rounded-2xl border border-[#d7e2f8] bg-white p-4 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: cfg.color }}>
                                <Icon className="text-sm" />
                              </span>
                              <div className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-800">{cfg.label}</span>
                                <span className="block text-[11px] text-slate-500">
                                  {cfg.type === "phone" ? "Enter phone number" : cfg.type === "username" ? "Enter username only" : cfg.type === "url" ? "Enter full URL" : "Enter custom value"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => movePlatformInstance(instance.id, "up")} disabled={index === 0} className="rounded-full border border-[#d7e2f8] bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Move up">
                                <FaArrowUp className="text-[10px]" />
                              </button>
                              <button type="button" onClick={() => movePlatformInstance(instance.id, "down")} disabled={index === platformInstances.length - 1} className="rounded-full border border-[#d7e2f8] bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Move down">
                                <FaArrowDown className="text-[10px]" />
                              </button>
                              <button type="button" onClick={() => addPlatformInstance(id)} className="rounded-full border border-[#cfe0ff] bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#244ea8] hover:bg-[#e5eeff]">Add</button>
                              <button type="button" onClick={() => removePlatformInstance(instance.id, id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100">Remove</button>
                            </div>
                          </div>
                          {isCustom ? (
                            <div className="space-y-2">
                              <input type="text" value={customLabels[String(instance.id)] ?? ""} onChange={(e) => setCustomLabels((p) => ({ ...p, [String(instance.id)]: e.target.value }))} className={inputClass} placeholder="Link label" />
                              <input type="url" value={value} onChange={(e) => setLinkValues((p) => ({ ...p, [String(instance.id)]: e.target.value }))} className={inputClass} placeholder={cfg.placeholder} />
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {cfg.prefix ? <p className="text-[11px] text-slate-500">Prefix: <span className="font-medium text-slate-700">{cfg.prefix}</span></p> : null}
                              {IRAQ_PHONE_PLATFORMS.includes(id) ? <p className="text-[11px] text-slate-500">+964 (Iraq) added automatically</p> : null}
                              <input
                                type={cfg.type === "phone" ? "tel" : cfg.type === "url" ? "url" : "text"}
                                value={value}
                                onChange={(e) => setLinkValues((p) => ({ ...p, [String(instance.id)]: e.target.value }))}
                                className={inputClass}
                                placeholder={cfg.placeholder}
                              />
                              {DEFAULT_MESSAGE_PLATFORMS.includes(id) ? (
                                <div className="mt-2">
                                  <label className="mb-1 block text-[11px] font-medium text-slate-500">Default message (optional)</label>
                                  <input type="text" value={defaultMessages[String(instance.id)] ?? ""} onChange={(e) => setDefaultMessages((p) => ({ ...p, [String(instance.id)]: e.target.value }))} className={inputClass} placeholder="e.g. Hi! I'm interested in your sponsor services." />
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-[#d7e2f8] bg-white px-6 py-3">
            {saveError ? <p className="mb-3 text-sm text-rose-600">{saveError}</p> : null}
            <div className="flex gap-3">
              {tab > 1 ? (
                <button type="button" onClick={() => setTab((t) => (t - 1) as 1 | 2 | 3)} disabled={saving} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Back
                </button>
              ) : null}
              {tab < 3 ? (
                <button
                  type="button"
                  onClick={() => { if (tab === 1 && !name.trim()) return; setTab((t) => (t + 1) as 1 | 2 | 3); }}
                  disabled={tab === 1 && !name.trim()}
                  className="ml-auto rounded-full bg-[#1f5ce0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4fc9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={savePage}
                  disabled={saving}
                  className="ml-auto flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#7d3aed_0%,#14b8a6_100%)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <><FaArrowsRotate className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Save Changes"}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

function ProfileModal({
  username,
  activeTab,
  onTabChange,
  message,
  onClose,
  onSuccess,
  onError,
  onClearMessage,
}: {
  username: string;
  activeTab: "password" | "username";
  onTabChange: (tab: "password" | "username") => void;
  message: { type: "success" | "error"; text: string } | null;
  onClose: () => void;
  onSuccess: (type: "password" | "username") => void;
  onError: (text: string) => void;
  onClearMessage: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    onClearMessage();
    if (newPassword.length < 8) {
      onError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      onError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        onError(data?.error ?? "Failed to update password.");
        return;
      }
      onSuccess("password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeUsername(e: FormEvent) {
    e.preventDefault();
    onClearMessage();
    const trimmed = newUsername.trim().toLowerCase();
    if (trimmed.length < 3 || trimmed.length > 64) {
      onError("Username must be 3-64 characters.");
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      onError("Username can only contain lowercase letters, numbers, hyphens, and underscores.");
      return;
    }
    if (trimmed === username) {
      onError("New username is the same as current.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newUsername: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        onError(data?.error ?? "Failed to update username.");
        return;
      }
      onSuccess("username");
      setCurrentPassword("");
      setNewUsername("");
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-[#1b49d0] focus:ring-2 focus:ring-[#c8d6ff]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#d7e2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#d7e2f8] bg-[linear-gradient(90deg,#f0f5ff_0%,#f8fffe_100%)] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 id="profile-modal-title" className="text-lg font-bold text-slate-900">
              Profile Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <FaXmark className="text-lg" />
            </button>
          </div>
          <div className="mt-4 flex gap-1 rounded-full border border-[#d7e2f8] bg-white/80 p-1">
            <button
              type="button"
              onClick={() => { onTabChange("password"); onClearMessage(); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "password"
                  ? "bg-[#e8efff] text-[#1a43b6] shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FaKey className="text-sm" />
              Change Password
            </button>
            <button
              type="button"
              onClick={() => { onTabChange("username"); onClearMessage(); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "username"
                  ? "bg-[#e8efff] text-[#1a43b6] shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FaUserPen className="text-sm" />
              Change Username
            </button>
          </div>
        </div>

        <div className="p-6">
          {message ? (
            <p
              className={`mb-4 rounded-full px-4 py-2.5 text-sm font-medium ${
                message.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          {activeTab === "password" ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Current password</span>
                <div className="relative">
                  <input
                    type={showPasswords.cp ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, cp: !p.cp }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.cp ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">New password</span>
                <div className="relative">
                  <input
                    type={showPasswords.np ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, np: !p.np }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.np ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <p className="text-xs text-slate-500">At least 8 characters.</p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</span>
                <div className="relative">
                  <input
                    type={showPasswords.cf ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, cf: !p.cf }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.cf ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[linear-gradient(90deg,#193fb9_0%,#1f5ce0_100%)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-70"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangeUsername} className="space-y-4">
              <p className="text-sm text-slate-600">Current username: <strong>{username}</strong></p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Current password</span>
                <div className="relative">
                  <input
                    type={showPasswords.cp ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, cp: !p.cp }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.cp ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">New username</span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={64}
                  autoComplete="username"
                  placeholder="3-64 chars, a-z, 0-9, -, _"
                  className={inputClass}
                />
              </label>
              <p className="text-xs text-slate-500">Lowercase letters, numbers, hyphens, and underscores only.</p>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[linear-gradient(90deg,#193fb9_0%,#1f5ce0_100%)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-70"
              >
                {loading ? "Updating..." : "Update Username"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-full border border-[#d5e1ff]/80 bg-[linear-gradient(135deg,#ffffff_0%,#f3f9ff_100%)] px-4 py-2 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-0.5 text-base font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function FilterDropdown<T extends string>({
  icon: Icon,
  value,
  options,
  onChange,
}: {
  icon: IconType;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`group inline-flex h-11 w-full items-center gap-2 rounded-full border px-4 text-base transition ${
          open
            ? "border-[#aac4ff] bg-[linear-gradient(135deg,#f5f8ff_0%,#f2fffc_100%)] shadow-[0_8px_18px_rgba(91,121,214,0.14)]"
            : "border-[#d9e3f8] bg-[linear-gradient(135deg,#ffffff_0%,#f9fbff_100%)] hover:border-[#c6d7fb] hover:bg-[linear-gradient(135deg,#f7faff_0%,#f3fffb_100%)]"
        }`}
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecf2ff] text-[#3f63b7]">
          <Icon className="text-sm" />
        </span>
        <span className="truncate text-left text-base font-medium text-slate-700">{active?.label}</span>
        <FaChevronDown
          className={`ml-auto text-xs text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#d7e2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-2 shadow-[0_18px_30px_rgba(63,82,148,0.18)]">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-[linear-gradient(135deg,#eaf0ff_0%,#e7fff8_100%)] text-[#28469c]"
                      : "text-slate-700 hover:bg-[#f2f6ff]"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      selected
                        ? "border-[#86a3f7] bg-[#dfe8ff] text-[#2a4eb4]"
                        : "border-[#d5deef] bg-white text-transparent"
                    }`}
                  >
                    <FaCheck className="text-[10px]" />
                  </span>
                  <span className="truncate font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  variant: "blue" | "cyan" | "white" | "mint";
}) {
  const cardClass =
    variant === "blue"
      ? "border-[#d4def7] bg-[linear-gradient(145deg,#f2f6ff_0%,#e8efff_100%)]"
      : variant === "cyan"
        ? "border-[#d2ebf5] bg-[linear-gradient(145deg,#f2fbff_0%,#e5f7fc_100%)]"
        : variant === "mint"
          ? "border-[#cdece7] bg-[linear-gradient(145deg,#effef9_0%,#e3f8f2_100%)]"
          : "border-[#f4d8e7] bg-[linear-gradient(145deg,#fff6fb_0%,#fff0f6_100%)]";

  const iconClass =
    variant === "blue"
      ? "bg-[#e0e9ff] text-[#1f5ce0]"
      : variant === "cyan"
        ? "bg-[#dff4fb] text-[#0b6a86]"
        : variant === "mint"
          ? "bg-[#dbf6ef] text-[#0d7a63]"
          : "bg-[#ffe3ef] text-[#a01f63]";

  const Icon = variant === "mint" ? FaClock : variant === "white" ? FaRegUserCircle : FaLink;

  return (
    <article className={`rounded-[1.5rem] border p-4 ${cardClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="text-xs" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </article>
  );
}
