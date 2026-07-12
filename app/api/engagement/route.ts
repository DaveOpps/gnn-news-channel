import { NextResponse } from "next/server";
import { getById, recordEngagement } from "@/lib/store";

/**
 * Fired once per reader as they leave a story, via sendBeacon — which posts
 * text/plain, so we parse the body ourselves rather than trusting the header.
 */
export async function POST(req: Request) {
  const raw = await req.text().catch(() => "");
  let body: { articleId?: string; depth?: number; seconds?: number } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const articleId = String(body?.articleId ?? "");
  if (!articleId || !(await getById(articleId))) {
    return NextResponse.json({ error: "Unknown article" }, { status: 400 });
  }

  await recordEngagement(articleId, Number(body?.depth ?? 0), Number(body?.seconds ?? 0));
  return NextResponse.json({ ok: true });
}
