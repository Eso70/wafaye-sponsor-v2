import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/database/db";
import { buildLinkHref } from "@/lib/linktree";

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

  let link: {
    id: number;
    page_id: number;
    platform_id: string;
    value: string;
    default_message: string | null;
    page_name: string;
  } | null = null;
  try {
    const res = await db.query(
      `SELECT l.id, l.page_id, l.platform_id, l.value, l.default_message, p.name AS page_name
       FROM linktree_links l
       JOIN linktree_pages p ON p.id = l.page_id
       WHERE l.id = $1
       LIMIT 1`,
      [linkIdNum],
    );
    link = res.rows[0] ?? null;
  } catch (err) {
    console.error("Redirect fetch error:", err);
  }

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const fingerprint = await getVisitorFingerprint(request);
  let isNewClick = false;
  try {
    const insertRes = await db.query(
      `INSERT INTO link_clicks (link_id, visitor_fingerprint)
       VALUES ($1, $2)
       ON CONFLICT (link_id, visitor_fingerprint) DO NOTHING
       RETURNING 1`,
      [linkIdNum, fingerprint],
    );
    isNewClick = (insertRes.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("Track click error:", err);
  }



  const href = buildLinkHref(link.platform_id, link.value, link.default_message);
  return NextResponse.redirect(href);
}
