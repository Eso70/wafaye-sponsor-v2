/**
 * TikTok Events API - Server-side event tracking
 * Sends ViewContent (page views) and ClickButton (link clicks) to TikTok.
 */

const TIKTOK_EVENTS_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export type TikTokEventContext = {
  ip: string;
  userAgent: string;
  externalId: string;
  pageUrl: string;
  referrer?: string;
};

type EventProperties = {
  contentId: string;
  contentType: string;
  contentName: string;
};

async function sendTikTokEvent(
  eventType: "ViewContent" | "ClickButton",
  context: TikTokEventContext,
  properties?: EventProperties
): Promise<void> {
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_EVENT_API_ACCESS_TOKEN;

  if (!pixelId || !accessToken) return;

  const eventId = `ev_${context.externalId}_${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const eventTime = Math.floor(Date.now() / 1000);

  const testEventCode = process.env.TIKTOK_TEST_EVENT_CODE?.trim();

  const eventData: Record<string, unknown> = {
    event: eventType,
    event_time: eventTime,
    event_id: eventId,
    user: {
      ip: context.ip,
      user_agent: context.userAgent,
      external_id: context.externalId,
    },
    page: {
      url: context.pageUrl,
      referrer: context.referrer || context.pageUrl,
    },
  };

  // Only add properties for ViewContent; omit for ClickButton to avoid "Purchase value invalid" warning
  if (properties && eventType === "ViewContent") {
    eventData.properties = {
      content_id: properties.contentId,
      content_type: properties.contentType,
      content_name: properties.contentName,
    };
  }

  const payload: Record<string, unknown> = {
    event_source: "web",
    event_source_id: pixelId,
    ...(testEventCode && { test_event_code: testEventCode }),
    data: [eventData],
  };

  try {
    const res = await fetch(TIKTOK_EVENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`TikTok Events API ${eventType} failed:`, res.status, text);
    }
  } catch (err) {
    console.error(`TikTok Events API ${eventType} error:`, err);
  }
}

export async function sendViewContentEvent(
  pageId: number,
  pageSlug: string,
  context: TikTokEventContext
): Promise<void> {
  await sendTikTokEvent("ViewContent", context, {
    contentId: String(pageId),
    contentType: "page",
    contentName: pageSlug || `Sponsor Page ${pageId}`,
  });
}

export async function sendClickButtonEvent(
  _linkId: number,
  _platformId: string,
  context: TikTokEventContext
): Promise<void> {
  await sendTikTokEvent("ClickButton", context);
}
