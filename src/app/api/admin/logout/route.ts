import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set({
    name: "admin_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
