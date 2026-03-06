import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { db } from "@/database/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MIN_PASSWORD_LENGTH = 8;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limiter = takeRateLimit(`admin-change-password:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const currentPassword =
    typeof body === "object" && body !== null && "currentPassword" in body
      ? String(body.currentPassword)
      : "";
  const newPassword =
    typeof body === "object" && body !== null && "newPassword" in body
      ? String(body.newPassword)
      : "";

  if (
    !currentPassword ||
    !newPassword ||
    newPassword.length < MIN_PASSWORD_LENGTH ||
    newPassword.length > 256
  ) {
    return NextResponse.json(
      { error: `New password must be ${MIN_PASSWORD_LENGTH}-256 characters.` },
      { status: 400 },
    );
  }

  let row: { password_hash: string } | null = null;
  try {
    const result = await db.query<{ password_hash: string }>(
      "SELECT password_hash FROM admin_credentials WHERE id = 1 AND username = $1 LIMIT 1",
      [session.sub],
    );
    row = result.rows[0] ?? null;
  } catch {
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }

  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  try {
    const newHash = hashPassword(newPassword);
    await db.query(
      "UPDATE admin_credentials SET password_hash = $1, updated_at = NOW() WHERE id = 1",
      [newHash],
    );
  } catch {
    return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
