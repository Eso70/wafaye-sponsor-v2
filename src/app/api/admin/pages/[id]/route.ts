import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { db } from "@/database/db";
import { getAppUrl } from "@/lib/app-url";
import { computePageStatus, normalizeIraqPhone } from "@/lib/linktree";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const pageId = parseInt(id, 10);
  if (isNaN(pageId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const pageRes = await db.query(
      `SELECT p.id, p.name, p.description, p.profile_image, p.slug, p.expires_at, p.is_official, p.show_footer, p.sponsor_name, p.sponsor_phone, p.updated_at,
        (SELECT COUNT(*) FROM page_views WHERE page_id = p.id) AS views,
        (SELECT COUNT(DISTINCT c.visitor_fingerprint) FROM link_clicks c
         JOIN linktree_links l ON c.link_id = l.id WHERE l.page_id = p.id) AS clicks
       FROM linktree_pages p WHERE p.id = $1`,
      [pageId]
    );
    const row = pageRes.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const linksRes = await db.query(
      `SELECT l.id, l.platform_id, l.label, l.value, l.default_message, l.sort_order,
        (SELECT COUNT(*) FROM link_clicks WHERE link_id = l.id) AS clicks
       FROM linktree_links l WHERE l.page_id = $1 ORDER BY l.sort_order ASC`,
      [pageId]
    );

    const baseUrl = getAppUrl();
    const pageUrl = row.is_official ? `${baseUrl}/` : `${baseUrl}/p/${row.slug}`;

    return NextResponse.json({
      id: row.id,
      name: row.name,
      description: row.description || "",
      profileImage: row.profile_image,
      pageUrl,
      status: computePageStatus(row.expires_at.toISOString().slice(0, 10)),
      expiresAt: row.expires_at.toISOString().slice(0, 10),
      views: Number(row.views),
      clicks: Number(row.clicks),
      isOfficial: row.is_official,
      showFooter: row.show_footer,
      sponsorName: row.sponsor_name || "Wafaye Sponsor",
      sponsorPhone: row.sponsor_phone,
      updatedAt: new Date(row.updated_at).toISOString().slice(0, 10),
      links: linksRes.rows.map((r) => ({
        id: r.id,
        platformId: r.platform_id,
        value: r.value,
        label: r.label,
        defaultMessage: r.default_message,
        clicks: Number(r.clicks),
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load page" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const pageId = parseInt(id, 10);
  if (isNaN(pageId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

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
  const sponsorPhone = typeof b.sponsorPhone === "string" ? b.sponsorPhone.trim() || null : null;

  const links = Array.isArray(b.links)
    ? (b.links as Array<{ platformId: string; value: string; label?: string; defaultMessage?: string }>)
    : [];

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!expiresAt || !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    return NextResponse.json({ error: "Valid expiresAt (YYYY-MM-DD) is required" }, { status: 400 });
  }

  try {
    const check = await db.query(
      "SELECT id, slug, is_official FROM linktree_pages WHERE id = $1",
      [pageId]
    );
    const existing = check.rows[0];
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    await db.query("BEGIN");

    if (existing.is_official) {
      await db.query(
        `UPDATE linktree_pages SET name = $1, description = $2, profile_image = $3, show_footer = $4, sponsor_name = $5, sponsor_phone = $6, updated_at = NOW()
         WHERE id = $7`,
        [name, description, profileImage, showFooter, sponsorName, sponsorPhone, pageId]
      );
    } else {
      await db.query(
        `UPDATE linktree_pages SET name = $1, description = $2, profile_image = $3, expires_at = $4, show_footer = $5, sponsor_name = $6, sponsor_phone = $7, updated_at = NOW()
         WHERE id = $8`,
        [name, description, profileImage, expiresAt, showFooter, sponsorName, sponsorPhone, pageId]
      );
    }

    await db.query("DELETE FROM linktree_links WHERE page_id = $1", [pageId]);

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
        const normalized = normalizeIraqPhone(value);
        if (normalized) value = normalized;
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

    const pageRes = await db.query(
      `SELECT p.id, p.name, p.description, p.profile_image, p.slug, p.expires_at, p.is_official, p.updated_at,
        (SELECT COUNT(*) FROM page_views WHERE page_id = p.id) AS views,
        (SELECT COUNT(DISTINCT c.visitor_fingerprint) FROM link_clicks c
         JOIN linktree_links l ON c.link_id = l.id WHERE l.page_id = p.id) AS clicks
       FROM linktree_pages p WHERE p.id = $1`,
      [pageId]
    );
    const page = pageRes.rows[0];
    const baseUrl = getAppUrl();

    return NextResponse.json({
      id: page.id,
      name: page.name,
      description: page.description || "",
      profileImage: page.profile_image,
      pageUrl: `${baseUrl}/p/${page.slug}`,
      status: computePageStatus(page.expires_at.toISOString().slice(0, 10)),
      expiresAt: page.expires_at.toISOString().slice(0, 10),
      views: Number(page.views),
      clicks: Number(page.clicks),
      isOfficial: page.is_official,
      updatedAt: new Date(page.updated_at).toISOString().slice(0, 10),
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const pageId = parseInt(id, 10);
  if (isNaN(pageId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const check = await db.query(
      "SELECT is_official FROM linktree_pages WHERE id = $1",
      [pageId]
    );
    const page = check.rows[0];
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    if (page.is_official) {
      return NextResponse.json(
        { error: "The official linktree cannot be deleted" },
        { status: 403 }
      );
    }

    await db.query("DELETE FROM linktree_pages WHERE id = $1", [pageId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
