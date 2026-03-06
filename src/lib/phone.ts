/**
 * Format stored Iraqi phone for input display: 9647501234567 -> 7501234567
 * So user sees the local part they would type (Links section).
 */
export function formatIraqPhoneForInput(value: string): string {
  if (!value || typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  if (digits.startsWith("964") && digits.length >= 12) return digits.slice(3);
  return value;
}
