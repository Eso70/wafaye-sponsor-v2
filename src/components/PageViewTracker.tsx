"use client";

import { useEffect } from "react";

export function PageViewTracker({ pageId }: { pageId: number }) {
  useEffect(() => {
    if (typeof pageId !== "number" || pageId < 1) return;

    // Dynamic TikTok PageView tracking for Client-side routing
    if (typeof window !== "undefined" && (window as any).ttq) {
      (window as any).ttq.page();
    }

    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId }),
      credentials: "include",
    }).catch(() => { });
  }, [pageId]);

  return null;
}
