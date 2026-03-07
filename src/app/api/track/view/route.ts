import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/database/db";
import { getAppUrl } from "@/lib/app-url";
import { sendViewContentEvent } from "@/lib/tiktok-events";

export const runtime = "nodejs";

const COOKIE_NAME = "vid";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

async function getVisitorFingerprint(request: NextRequest): Promise<string> {
  const cookieStore = await cookies();
  const vid = cookieStore.get(COOKIE_NAME)?.value;
  if (vid && /^[a-zA-Z0-9_-]{16,64}$/.test(vid)) return vid;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 32);
}

export async function POST(request: NextRequest) {
  let pageId: number;
  try {
    const body = await request.json().catch(() => ({}));
    pageId = typeof body.pageId === "number" ? body.pageId : parseInt(String(body.pageId ?? request.nextUrl.searchParams.get("pageId") ?? ""), 10);
  } catch {
    pageId = parseInt(request.nextUrl.searchParams.get("pageId") ?? "", 10);
  }

  if (isNaN(pageId) || pageId < 1) {
    return NextResponse.json({ error: "Invalid pageId" }, { status: 400 });
  }

  const fingerprint = await getVisitorFingerprint(request);

  try {
    await db.query(
      `INSERT INTO page_views (page_id, visitor_fingerprint) VALUES ($1, $2) ON CONFLICT (page_id, visitor_fingerprint) DO NOTHING`,
      [pageId, fingerprint]
    );
  } catch (err) {
    console.error("Track view error:", err);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }

  const baseUrl = getAppUrl();
  const pageUrl = request.headers.get("referer") || `${baseUrl}/`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "unknown";

  let pageSlug = "";
  try {
    const row = await db.query(`SELECT slug FROM linktree_pages WHERE id = $1`, [pageId]);
    pageSlug = (row.rows[0]?.slug as string) || "";
  } catch {
    /* ignore */
  }

  sendViewContentEvent(pageId, pageSlug, {
    ip,
    userAgent: ua,
    externalId: fingerprint,
    pageUrl,
    referrer: request.headers.get("referer") || undefined,
  }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  if (!(await cookies()).get(COOKIE_NAME)) {
    const randomPart = createHash("sha256").update(`${fingerprint}:${Date.now()}`).digest("hex").slice(0, 16);
    res.cookies.set(COOKIE_NAME, `${fingerprint.slice(0, 8)}${randomPart}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return res;
}
