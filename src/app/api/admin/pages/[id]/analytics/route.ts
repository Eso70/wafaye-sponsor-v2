import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { db } from "@/database/db";

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

export async function PATCH(
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
    await db.query("DELETE FROM link_clicks WHERE link_id IN (SELECT id FROM linktree_links WHERE page_id = $1)", [
      pageId,
    ]);
    await db.query("DELETE FROM page_views WHERE page_id = $1", [pageId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to clear analytics" }, { status: 500 });
  }
}
