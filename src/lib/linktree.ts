import "server-only";

const PLATFORM_PREFIX: Record<string, string> = {
  whatsapp: "https://wa.me/",
  telegram: "https://t.me/",
  viber: "viber://chat?number=",
  phone: "tel:",
};

const PHONE_PLATFORMS = ["whatsapp", "viber", "phone"];

/**
 * Normalize Iraqi phone input: 07501234567 or 7501234567 -> 9647501234567
 * Backend adds 964 (Iraq), user enters only local part.
 */
export function normalizeIraqPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  let rest = digits;
  if (rest.startsWith("964")) rest = rest.slice(3);
  else if (rest.startsWith("0")) rest = rest.slice(1);
  if (rest.length === 9 && rest.startsWith("7")) return "964" + rest;
  if (rest.length >= 9) return "964" + rest.slice(-9);
  return "964" + rest;
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
      const normalized = normalizeIraqPhone(value) || value.replace(/\D/g, "");
      const digits = normalized.startsWith("964") ? normalized : value.replace(/\D/g, "");
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
