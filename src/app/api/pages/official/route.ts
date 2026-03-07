import { NextResponse } from "next/server";
import { db } from "@/database/db";
import { getAppUrl } from "@/lib/app-url";

export const runtime = "nodejs";

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  viber: "Viber",
  phone: "Phone Call",
};

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  telegram: "#229ED9",
  viber: "#7360F2",
  phone: "#1F5CE0",
};

export async function GET() {
  try {
    const pageRes = await db.query(
      `SELECT id, name, description, profile_image, slug, expires_at, views, clicks, show_footer, sponsor_name, sponsor_phone
       FROM linktree_pages WHERE is_official = true LIMIT 1`
    );
    const page = pageRes.rows[0];
    if (!page) {
      return NextResponse.json({ error: "Official page not found" }, { status: 404 });
    }

    const linksRes = await db.query(
      `SELECT id, platform_id, label, value, default_message, sort_order FROM linktree_links
       WHERE page_id = $1 ORDER BY sort_order ASC`,
      [page.id]
    );

    const baseUrl = getAppUrl();
    const links = linksRes.rows.map((row) => ({
      id: row.id,
      label: row.label || PLATFORM_LABELS[row.platform_id] || row.platform_id,
      href: `${baseUrl}/api/r/${row.id}`,
      platformId: row.platform_id,
      color: PLATFORM_COLORS[row.platform_id] || "#64748b",
    }));

    return NextResponse.json({
      id: page.id,
      name: page.name,
      description: page.description,
      image: page.profile_image,
      slug: page.slug,
      links,
      showFooter: page.show_footer,
      sponsorName: page.sponsor_name,
      sponsorPhone: page.sponsor_phone,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load page" }, { status: 500 });
  }
}
