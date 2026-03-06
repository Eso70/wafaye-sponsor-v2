import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  sub: string;
  exp: number;
};

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short");
  }

  return createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(subject: string): string {
  const payload: SessionPayload = {
    sub: subject,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  if (providedSignature.length !== expectedSignature.length) {
    return null;
  }
  const validSignature = timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(expectedSignature),
  );

  if (!validSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
