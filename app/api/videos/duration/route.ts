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

/** Looks up a YouTube video's real runtime by reading it off the public
 *  watch page — there's no thumbnail-style CDN endpoint for duration, and
 *  the official Data API would require the user to provision a Google Cloud
 *  API key just for this one field. */
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
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GhanaNewspapersBot/1.0)" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not reach YouTube" }, { status: 502 });
    }
    const html = await res.text();
    const match = html.match(/"lengthSeconds":"(\d+)"/);
    if (!match) {
      return NextResponse.json({ error: "Duration not found for this video" }, { status: 404 });
    }
    return NextResponse.json({ duration: formatDuration(parseInt(match[1], 10)) });
  } catch {
    return NextResponse.json({ error: "Could not fetch duration" }, { status: 502 });
  }
}
