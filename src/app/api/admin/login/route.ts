import { NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { createSessionToken } from "@/lib/auth";
import { db } from "@/database/db";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function parseStoredHash(storedHash: string): { salt: Buffer; hash: Buffer } | null {
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

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = takeRateLimit(`admin-login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limiter.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username =
    typeof body === "object" && body !== null && "username" in body
      ? String(body.username).trim().toLowerCase()
      : "";
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String(body.password)
      : "";

  if (!username || !password || username.length > 64 || password.length > 256) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let row: { username: string; password_hash: string } | null = null;
  try {
    const result = await db.query<{ username: string; password_hash: string }>(
      "SELECT username, password_hash FROM admin_credentials WHERE id = 1 AND username = $1 LIMIT 1",
      [username],
    );
    row = result.rows[0] ?? null;
  } catch {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const parsed = parseStoredHash(row.password_hash);
  if (!parsed) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  const derived = scryptSync(password, parsed.salt, parsed.hash.length);
  const passwordMatches = timingSafeEqual(derived, parsed.hash);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let token = "";
  try {
    token = createSessionToken(row.username);
  } catch {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set({
    name: "admin_session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
