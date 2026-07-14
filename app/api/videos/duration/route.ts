import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { youtubeId } from "@/lib/types";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Looks up a YouTube video's real runtime via the same internal "innertube"
 * player API youtube.com's own web player calls (the same endpoint tools
 * like yt-dlp use) — not by scraping the watch page's HTML. Scraping the
 * page directly works from a home/office IP but unreliably returns YouTube's
 * consent/bot-check interstitial instead of the real page when called from
 * cloud datacenter IPs (e.g. Vercel's), which this sidesteps entirely.
 * No API key needed — this is the public key youtube.com's own frontend
 * embeds in every page load.
 */
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

export async function GET(req: Request) {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = youtubeId(searchParams.get("id") ?? "");
  if (!id) {
    return NextResponse.json({ error: "Invalid YouTube id" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: id,
          context: { client: { clientName: "WEB", clientVersion: "2.20240101.00.00" } },
        }),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Could not reach YouTube" }, { status: 502 });
    }
    const data = await res.json();
    const seconds = parseInt(data?.videoDetails?.lengthSeconds ?? "", 10);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return NextResponse.json({ error: "Duration not found for this video" }, { status: 404 });
    }
    return NextResponse.json({ duration: formatDuration(seconds) });
  } catch {
    return NextResponse.json({ error: "Could not fetch duration" }, { status: 502 });
  }
}
