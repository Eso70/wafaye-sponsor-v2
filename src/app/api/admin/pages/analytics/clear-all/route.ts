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

export async function PATCH() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await db.query("DELETE FROM link_clicks");
    await db.query("DELETE FROM page_views");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to clear analytics" }, { status: 500 });
  }
}
