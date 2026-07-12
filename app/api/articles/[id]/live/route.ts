import { NextResponse } from "next/server";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import { getById, getLiveUpdates, addLiveUpdate, logActivity } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

/** Public: the rolling feed for a story. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const article = await getById(id);
  if (!article || article.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(await getLiveUpdates(id));
}

/** Post a new update to the feed. */
export async function POST(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const article = await getById(id);
  if (!article || article.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditArticle(me, article)) {
    return NextResponse.json(
      { error: "This story belongs to another editor" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "An update needs some text" }, { status: 400 });
  }

  const update = await addLiveUpdate(id, text, me, Boolean(body?.isKey));
  await logActivity({
    action: "live.posted",
    editorId: me.id,
    editorName: me.name,
    target: article.title,
    targetId: article.id,
    detail: body?.isKey ? "key update" : undefined,
  });

  return NextResponse.json(update, { status: 201 });
}
