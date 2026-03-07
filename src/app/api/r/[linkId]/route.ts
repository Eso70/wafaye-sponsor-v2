import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/database/db";
import { getAppUrl } from "@/lib/app-url";
import { buildLinkHref } from "@/lib/linktree";
import { sendClickButtonEvent } from "@/lib/tiktok-events";

export const runtime = "nodejs";

const COOKIE_NAME = "vid";

async function getVisitorFingerprint(request: NextRequest): Promise<string> {
  const cookieStore = await cookies();
  const vid = cookieStore.get(COOKIE_NAME)?.value;
  if (vid && /^[a-zA-Z0-9_-]{16,64}$/.test(vid)) return vid;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 32);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const linkIdNum = parseInt(linkId, 10);
  if (isNaN(linkIdNum) || linkIdNum < 1) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let link: { platform_id: string; value: string; default_message: string | null } | null = null;
  try {
    const res = await db.query(
      `SELECT platform_id, value, default_message FROM linktree_links WHERE id = $1`,
      [linkIdNum]
    );
    link = res.rows[0] ?? null;
  } catch (err) {
    console.error("Redirect fetch error:", err);
  }

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const fingerprint = await getVisitorFingerprint(request);
  try {
    await db.query(
      `INSERT INTO link_clicks (link_id, visitor_fingerprint) VALUES ($1, $2) ON CONFLICT (link_id, visitor_fingerprint) DO NOTHING`,
      [linkIdNum, fingerprint]
    );
  } catch (err) {
    console.error("Track click error:", err);
  }

  const baseUrl = getAppUrl();
  const referer = request.headers.get("referer") || request.headers.get("origin") || baseUrl;
  sendClickButtonEvent(linkIdNum, link.platform_id, {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    userAgent: request.headers.get("user-agent") ?? "unknown",
    externalId: fingerprint,
    pageUrl: referer,
    referrer: request.headers.get("referer") ?? undefined,
  }).catch(() => {});

  const href = buildLinkHref(link.platform_id, link.value, link.default_message);
  return NextResponse.redirect(href);
}
