/**
 * Format stored Iraqi phone for input display: 9647501234567 -> 7501234567
 * So user sees the local part they would type (Links section).
 * Also fixes corrupted 9-digit numbers missing leading 7 (e.g. 509516125 -> 7509516125).
 */
export function formatIraqPhoneForInput(value: string): string {
  if (!value || typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  if (digits.startsWith("964") && digits.length >= 12) return digits.slice(3);
  // Corrupted 9 digits missing leading 7 (e.g. 509516125 from 7509516125)
  if (digits.length === 9 && !digits.startsWith("7")) return "7" + digits;
  return digits;
}
