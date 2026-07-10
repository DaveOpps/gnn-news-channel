import { NextResponse } from "next/server";
import { heartbeat, activeReaders } from "@/lib/presence";

/** Public heartbeat from a reader on a story. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId = String(body?.sessionId ?? "").slice(0, 64);
  const articleId = body?.articleId ? String(body.articleId).slice(0, 64) : undefined;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  heartbeat(sessionId, articleId);
  return NextResponse.json({
    readers: articleId ? activeReaders(articleId) : activeReaders(),
    site: activeReaders(),
  });
}
