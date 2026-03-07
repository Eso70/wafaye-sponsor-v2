import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_KEYS = [
  "TIKTOK_PIXEL_ID",
  "TIKTOK_EVENT_API_ACCESS_TOKEN",
  "TIKTOK_TEST_EVENT_CODE",
] as const;

const DEFAULT_TIKTOK_PIXEL_ID = "D6M52Q3C77U160FIC8M0";
const DEFAULT_TIKTOK_EVENT_API_ACCESS_TOKEN = "3773c09c919694d614c913af083a19967c7b4673";

type EnvKey = (typeof ALLOWED_KEYS)[number];

function getEnvPath(): string {
  return join(process.cwd(), ".env");
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\(.)/g, "$1");
    }
    result[key] = value;
  }
  return result;
}

function formatEnvValue(value: string): string {
  if (value.includes(" ") || value.includes("#") || value.includes("=") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }
  return value;
}

function updateEnvContent(content: string, updates: Partial<Record<EnvKey, string>>): string {
  const lines = content.split("\n");
  const seen = new Set<string>();
  const newLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    let replaced = false;

    for (const key of ALLOWED_KEYS) {
      const newVal = updates[key];
      if (newVal === undefined) continue;
      const regex = new RegExp(`^${key}\\s*=`);
      if (regex.test(trimmed)) {
        newLines.push(`${key}=${formatEnvValue(newVal)}`);
        seen.add(key);
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      newLines.push(line);
    }
  }

  const missingKeys = ALLOWED_KEYS.filter((k) => updates[k] !== undefined && !seen.has(k));
  if (missingKeys.length > 0) {
    const hasTiktokSection = newLines.some((l) => /#\s*TikTok/i.test(l.trim()));
    if (!hasTiktokSection) {
      newLines.push("", "# TikTok");
    }
    for (const k of missingKeys) {
      newLines.push(`${k}=${formatEnvValue(updates[k] ?? "")}`);
    }
  }

  return newLines.join("\n");
}

async function requireAdmin(): Promise<{ ok: false; response: NextResponse } | { ok: true }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const content = await readFile(getEnvPath(), "utf-8");
    const parsed = parseEnvFile(content);
    return NextResponse.json({
      TIKTOK_PIXEL_ID: (parsed.TIKTOK_PIXEL_ID || "").trim() || DEFAULT_TIKTOK_PIXEL_ID,
      TIKTOK_EVENT_API_ACCESS_TOKEN: (parsed.TIKTOK_EVENT_API_ACCESS_TOKEN || "").trim() || DEFAULT_TIKTOK_EVENT_API_ACCESS_TOKEN,
      TIKTOK_TEST_EVENT_CODE: parsed.TIKTOK_TEST_EVENT_CODE ?? "",
    });
  } catch {
    return NextResponse.json({
      TIKTOK_PIXEL_ID: DEFAULT_TIKTOK_PIXEL_ID,
      TIKTOK_EVENT_API_ACCESS_TOKEN: DEFAULT_TIKTOK_EVENT_API_ACCESS_TOKEN,
      TIKTOK_TEST_EVENT_CODE: "",
    });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Partial<Record<EnvKey, string>> = {};
  for (const key of ALLOWED_KEYS) {
    if (typeof body === "object" && body !== null && key in body) {
      const val = (body as Record<string, unknown>)[key];
      updates[key] = typeof val === "string" ? val : String(val ?? "");
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid keys to update" }, { status: 400 });
  }

  try {
    const path = getEnvPath();
    let content = await readFile(path, "utf-8");
    content = updateEnvContent(content, updates);
    await writeFile(path, content, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
