import "server-only";

const PLATFORM_PREFIX: Record<string, string> = {
  whatsapp: "https://wa.me/",
  telegram: "https://t.me/",
  viber: "viber://chat?number=",
  phone: "tel:",
};

const PHONE_PLATFORMS = ["whatsapp", "viber", "phone"];

/**
 * Normalize phone to digits only. Value can be full international (9647501234567)
 * or local with country code (7501234567 + Iraq). For backward compatibility,
 * Iraqi local numbers (9 digits starting with 7) get 964 prepended if no country code.
 * @deprecated Prefer normalizePhone from phone.ts with explicit countryCode
 */
export function normalizeIraqPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  if (digits.startsWith("964") || digits.length > 10) return digits;
  if (digits.length === 9 && digits.startsWith("7")) return "964" + digits;
  if (digits.length === 9 && !digits.startsWith("7")) return "9647" + digits;
  return "964" + digits;
}

/**
 * Normalize phone to full international digits.
 * - If value already looks like full international (10+ digits, or starts with known code), return digits.
 * - Otherwise treat as local and prepend default country (964).
 */
export function normalizePhoneValue(
  value: string,
  _countryCode?: string | null
): string {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  if (digits.startsWith("964") && digits.length >= 12) return digits;
  if (digits.length >= 10 && !digits.startsWith("964")) return digits;
  if (digits.length === 9 && digits.startsWith("7")) return "964" + digits;
  if (digits.length === 9 && !digits.startsWith("7")) return "9647" + digits;
  return "964" + digits;
}

/**
 * Platforms that support a pre-filled default message via URL.
 * WhatsApp: ?text=, Telegram: ?text=, Viber: &draft=
 */
const MESSAGE_PARAM: Record<string, "text" | "draft"> = {
  whatsapp: "text",
  telegram: "text",
  viber: "draft",
};

export function buildLinkHref(
  platformId: string,
  value: string,
  defaultMessage?: string | null
): string {
  const prefix = PLATFORM_PREFIX[platformId];
  if (prefix) {
    let clean: string;
    if (PHONE_PLATFORMS.includes(platformId)) {
      const digits = value.replace(/\D/g, "");
      clean = platformId === "whatsapp" ? digits : (digits ? `+${digits}` : value);
    } else {
      clean = value;
    }
    let href = `${prefix}${clean}`;
    const msg = defaultMessage?.trim();
    if (msg && MESSAGE_PARAM[platformId]) {
      const param = MESSAGE_PARAM[platformId];
      const sep = platformId === "viber" ? "&" : "?";
      href += `${sep}${param}=${encodeURIComponent(msg)}`;
    }
    return href;
  }
  return value.startsWith("http") ? value : `https://${value}`;
}

export function computePageStatus(expiresAt: string): "active" | "expires_soon" | "expired" {
  const today = new Date();
  const expiry = new Date(`${expiresAt}T00:00:00`);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return "expired";
  if (daysLeft <= 30) return "expires_soon";
  return "active";
}
