import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_OUTPUT_LENGTH = 64;

export function parseStoredHash(storedHash: string): { salt: Buffer; hash: Buffer } | null {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return null;
  }

  const salt = Buffer.from(parts[1], "hex");
  const hash = Buffer.from(parts[2], "hex");

  if (salt.length === 0 || hash.length === 0) {
    return null;
  }

  return { salt, hash };
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parsed = parseStoredHash(storedHash);
  if (!parsed) return false;
  const derived = scryptSync(password, parsed.salt, parsed.hash.length);
  return timingSafeEqual(derived, parsed.hash);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, HASH_OUTPUT_LENGTH);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}
