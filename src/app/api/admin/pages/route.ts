import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { db } from "@/database/db";
import { getAppUrl } from "@/lib/app-url";
import { computePageStatus, normalizePhoneValue } from "@/lib/linktree";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "page";
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const res = await db.query(
      `SELECT p.id, p.name, p.description, p.profile_image, p.slug, p.expires_at, p.is_official, p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM page_views WHERE page_id = p.id) AS views,
        (SELECT COUNT(DISTINCT c.visitor_fingerprint) FROM link_clicks c
         JOIN linktree_links l ON c.link_id = l.id WHERE l.page_id = p.id) AS clicks
       FROM linktree_pages p ORDER BY p.is_official DESC, p.updated_at DESC`
    );

    const baseUrl = getAppUrl();
    const pages = res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      profileImage: row.profile_image,
      pageUrl: row.is_official ? `${baseUrl}/` : `${baseUrl}/p/${row.slug}`,
      status: computePageStatus(row.expires_at.toISOString().slice(0, 10)),
      expiresAt: row.expires_at.toISOString().slice(0, 10),
      views: Number(row.views),
      clicks: Number(row.clicks),
      isOfficial: row.is_official,
      updatedAt: new Date(row.updated_at).toISOString().slice(0, 10),
    }));

    return NextResponse.json(pages);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const profileImage =
    typeof b.profileImage === "string" && b.profileImage.startsWith("/")
      ? b.profileImage
      : "/images/DefaultAvatar.png";
  const expiresAt = typeof b.expiresAt === "string" ? b.expiresAt : "";
  const showFooter = b.showFooter !== false;
  const sponsorName = typeof b.sponsorName === "string" ? b.sponsorName.trim() || "Wafaye Sponsor" : "Wafaye Sponsor";
  let sponsorPhone: string | null = typeof b.sponsorPhone === "string" ? b.sponsorPhone.trim() || null : null;
  if (sponsorPhone) {
    const normalized = normalizePhoneValue(sponsorPhone);
    if (normalized) sponsorPhone = normalized;
  }

  const links = Array.isArray(b.links)
    ? (b.links as Array<{ platformId: string; value: string; label?: string; defaultMessage?: string }>)
    : [];

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!expiresAt || !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    return NextResponse.json({ error: "Valid expiresAt (YYYY-MM-DD) is required" }, { status: 400 });
  }

  let slug = slugify(name);
  try {
    const exists = await db.query(
      "SELECT id FROM linktree_pages WHERE slug = $1",
      [slug]
    );
    if (exists.rows.length > 0) {
      let i = 2;
      while (true) {
        const candidate = `${slug}-${i}`;
        const ex = await db.query("SELECT id FROM linktree_pages WHERE slug = $1", [candidate]);
        if (ex.rows.length === 0) {
          slug = candidate;
          break;
        }
        i++;
      }
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate slug" }, { status: 500 });
  }

  try {
    await db.query("BEGIN");
    const pageRes = await db.query(
      `INSERT INTO linktree_pages (name, description, profile_image, slug, expires_at, is_official, show_footer, sponsor_name, sponsor_phone)
       VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8)
       RETURNING id, name, description, profile_image, slug, expires_at, views, clicks, is_official, updated_at`,
      [name, description, profileImage, slug, expiresAt, showFooter, sponsorName, sponsorPhone]
    );
    const page = pageRes.rows[0];
    const pageId = page.id;

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (
        typeof link !== "object" ||
        !link ||
        typeof link.platformId !== "string" ||
        typeof link.value !== "string" ||
        !link.value.trim()
      )
        continue;
      let value = link.value.trim();
      if (["whatsapp", "viber", "phone"].includes(link.platformId)) {
        value = normalizePhoneValue(value) || value;
      }
      const label = typeof link.label === "string" ? link.label.trim() : null;
      const defaultMessage =
        typeof link.defaultMessage === "string" ? link.defaultMessage.trim() || null : null;
      await db.query(
        `INSERT INTO linktree_links (page_id, platform_id, label, value, default_message, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pageId, link.platformId, label || null, value, defaultMessage, i]
      );
    }

    await db.query("COMMIT");

    const baseUrl = getAppUrl();
    return NextResponse.json({
      id: page.id,
      name: page.name,
      description: page.description || "",
      profileImage: page.profile_image,
      pageUrl: `${baseUrl}/p/${page.slug}`,
      status: computePageStatus(page.expires_at.toISOString().slice(0, 10)),
      expiresAt: page.expires_at.toISOString().slice(0, 10),
      views: 0,
      clicks: 0,
      isOfficial: false,
      updatedAt: new Date(page.updated_at).toISOString().slice(0, 10),
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
