import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "./country-codes";

/** Sorted by code length descending for longest-match parsing (964 before 96 before 9) */
const COUNTRY_CODES_SORTED = [...COUNTRY_CODES].sort(
  (a, b) => b.code.length - a.code.length
);

export type PhoneParts = { countryCode: string; localNumber: string };

/**
 * Parse a stored international phone (digits only, e.g. "9647501234567") into
 * country code and local number. Uses longest-match for country codes.
 */
export function parsePhoneToParts(value: string): PhoneParts {
  if (!value || typeof value !== "string") return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: "" };
  const digits = value.replace(/\D/g, "");
  if (!digits) return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: "" };
  // Try to match a known country code from the start
  for (const c of COUNTRY_CODES_SORTED) {
    if (digits.startsWith(c.code) && digits.length > c.code.length) {
      return {
        countryCode: c.code,
        localNumber: digits.slice(c.code.length).replace(/^0+/, ""),
      };
    }
  }
  // No match: assume default country (Iraq), treat all as local
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length > DEFAULT_COUNTRY_CODE.length) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      localNumber: digits.slice(DEFAULT_COUNTRY_CODE.length).replace(/^0+/, ""),
    };
  }
  return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: digits.replace(/^0+/, "") };
}

/**
 * Format stored phone for input display. Returns { countryCode, localNumber }.
 * Used when loading into the admin form.
 */
export function formatPhoneForInput(value: string): PhoneParts {
  return parsePhoneToParts(value);
}

/**
 * Normalize phone to full international digits.
 * @param localNumber - Local part (e.g. "7501234567")
 * @param countryCode - Dial code without + (e.g. "964")
 */
export function normalizePhone(
  localNumber: string,
  countryCode: string
): string {
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  const code = (countryCode || DEFAULT_COUNTRY_CODE).replace(/\D/g, "");
  if (!code) return digits;
  return code + digits;
}

/**
 * Normalize phone to full international digits (Iraq default for sponsor/footer).
 * Handles both full international and Iraq local input.
 */
export function normalizePhoneValue(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  if (digits.startsWith("964") && digits.length >= 12) return digits;
  if (digits.length >= 10 && !digits.startsWith("964")) return digits;
  if (digits.length === 9 && digits.startsWith("7")) return DEFAULT_COUNTRY_CODE + digits;
  if (digits.length === 9 && !digits.startsWith("7")) return DEFAULT_COUNTRY_CODE + "7" + digits;
  return DEFAULT_COUNTRY_CODE + digits;
}

/**
 * Format stored Iraqi phone for input display (legacy helper).
 * Prefer formatPhoneForInput for new code.
 */
export function formatIraqPhoneForInput(value: string): string {
  const { localNumber } = formatPhoneForInput(value);
  return localNumber;
}
