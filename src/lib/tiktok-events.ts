import "server-only";

type TiktokEventName = "ViewContent" | "ClickButton";

type SendTiktokEventInput = {
  eventName: TiktokEventName;
  eventId: string;
  request: Request;
  url: string;
  contentId: string;
  contentType: string;
  contentName: string;
  description?: string;
};

function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
  if (!ip || ip === "unknown") return undefined;
  return ip;
}

function getCookieFromRequest(request: Request, key: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const entry of cookies) {
    const [name, ...rest] = entry.split("=");
    if (name !== key) continue;
    const value = rest.join("=");
    if (!value) return undefined;
    return decodeURIComponent(value);
  }
  return undefined;
}

function getTtclid(request: Request, fallbackUrl: string): string | undefined {
  try {
    const reqUrl = new URL(request.url);
    const fromRequestUrl = reqUrl.searchParams.get("ttclid");
    if (fromRequestUrl) return fromRequestUrl;
  } catch {}

  try {
    const ref = request.headers.get("referer");
    if (ref) {
      const fromRef = new URL(ref).searchParams.get("ttclid");
      if (fromRef) return fromRef;
    }
  } catch {}

  try {
    const fromUrl = new URL(fallbackUrl).searchParams.get("ttclid");
    if (fromUrl) return fromUrl;
  } catch {}

  return undefined;
}

export async function sendTiktokEvent(input: SendTiktokEventInput): Promise<void> {
  const pixelId = process.env.TIKTOK_PIXEL_ID?.trim();
  const accessToken = process.env.TIKTOK_EVENT_API_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) return;

  const testEventCode = process.env.TIKTOK_TEST_EVENT_CODE?.trim();
  const userAgent = input.request.headers.get("user-agent") || undefined;
  const ip = getClientIp(input.request);
  const ttp = getCookieFromRequest(input.request, "_ttp") || getCookieFromRequest(input.request, "ttp");
  const ttclid = getTtclid(input.request, input.url);

  const payload = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: input.eventName,
        event_id: input.eventId,
        event_time: Math.floor(Date.now() / 1000),
        context: {
          page: {
            url: input.url,
          },
          user: {
            ...(ip ? { ip } : {}),
            ...(userAgent ? { user_agent: userAgent } : {}),
            ...(ttclid ? { ttclid } : {}),
            ...(ttp ? { ttp } : {}),
          },
        },
        properties: {
          content_id: input.contentId,
          content_type: input.contentType,
          content_name: input.contentName,
          ...(input.description ? { description: input.description } : {}),
        },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("TikTok Events API error:", response.status, body);
    }
  } catch (error) {
    console.error("TikTok Events API request failed:", error);
  }
}
