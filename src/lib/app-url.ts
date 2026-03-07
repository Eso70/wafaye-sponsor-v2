/**
 * Returns a valid absolute URL for the app.
 * Ensures protocol (https://) is present - "wafaye-sponsor.com" becomes "https://wafaye-sponsor.com"
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trimmed = String(raw).trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
