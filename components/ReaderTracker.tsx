"use client";

import { useEffect, useRef } from "react";

/** A per-tab id, so one reader with two tabs isn't counted as two people twice. */
function sessionId(): string {
  const KEY = "gnn_sid";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Two jobs, both fire-and-forget:
 *  - a heartbeat so the newsroom sees live readers
 *  - one engagement beacon as the reader leaves, carrying how far they got
 */
export default function ReaderTracker({ articleId }: { articleId: string }) {
  const maxDepth = useRef(0);
  const startedAt = useRef(Date.now());
  const sent = useRef(false);

  useEffect(() => {
    const sid = sessionId();
    startedAt.current = Date.now();

    const beat = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, articleId }),
        keepalive: true,
      }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, 20_000);

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        scrollable > 0
          ? Math.min(100, ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100)
          : 100;
      if (pct > maxDepth.current) maxDepth.current = pct;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const send = () => {
      if (sent.current) return;
      sent.current = true;
      const payload = JSON.stringify({
        articleId,
        depth: Math.round(maxDepth.current),
        seconds: Math.round((Date.now() - startedAt.current) / 1000),
      });
      // sendBeacon survives the page going away; fetch may not.
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/engagement", payload);
      } else {
        fetch("/api/engagement", { method: "POST", body: payload, keepalive: true }).catch(
          () => {}
        );
      }
    };

    const onHide = () => document.visibilityState === "hidden" && send();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);

    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
      send(); // navigating away inside the SPA
    };
  }, [articleId]);

  return null;
}
