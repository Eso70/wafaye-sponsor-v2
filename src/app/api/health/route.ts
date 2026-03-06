import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  void env.DATABASE_URL;

  return NextResponse.json(
    { status: "ok" },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );
}
