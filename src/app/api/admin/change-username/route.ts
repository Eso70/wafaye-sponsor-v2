import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, createSessionToken } from "@/lib/auth";
import { db } from "@/database/db";
import { verifyPassword } from "@/lib/password";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 64;
const USERNAME_REGEX = /^[a-z0-9_-]+$/;
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
  const limiter = takeRateLimit(`admin-change-username:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
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
  const newUsername =
    typeof body === "object" && body !== null && "newUsername" in body
      ? String(body.newUsername).trim().toLowerCase()
      : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }

  if (
    newUsername.length < USERNAME_MIN_LENGTH ||
    newUsername.length > USERNAME_MAX_LENGTH ||
    !USERNAME_REGEX.test(newUsername)
  ) {
    return NextResponse.json(
      {
        error: `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters, lowercase letters, numbers, hyphens, and underscores only.`,
      },
      { status: 400 },
    );
  }

  if (newUsername === session.sub) {
    return NextResponse.json({ error: "New username is the same as current." }, { status: 400 });
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
    await db.query(
      "UPDATE admin_credentials SET username = $1, updated_at = NOW() WHERE id = 1",
      [newUsername],
    );
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23505") {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update username. Please try again." }, { status: 500 });
  }

  let newToken = "";
  try {
    newToken = createSessionToken(newUsername);
  } catch {
    return NextResponse.json({ error: "Session update failed. Please log in again." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set({
    name: "admin_session",
    value: newToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
