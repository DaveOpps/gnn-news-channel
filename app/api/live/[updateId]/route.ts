import { NextResponse } from "next/server";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import {
  getById,
  getLiveUpdateById,
  setLiveUpdateKey,
  deleteLiveUpdate,
  logActivity,
} from "@/lib/store";

type Params = { params: Promise<{ updateId: string }> };

async function guard(updateId: string) {
  const me = await getCurrentEditor();
  if (!me) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const update = await getLiveUpdateById(updateId);
  if (!update) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };

  const article = await getById(update.articleId);
  if (!article) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };

  if (!canEditArticle(me, article)) {
    return {
      error: NextResponse.json(
        { error: "This story belongs to another editor" },
        { status: 403 }
      ),
    };
  }
  return { me, update, article };
}

/** Toggle a "key development" highlight. */
export async function PUT(req: Request, { params }: Params) {
  const { updateId } = await params;
  const g = await guard(updateId);
  if ("error" in g) return g.error;

  const body = await req.json().catch(() => ({}));
  const updated = await setLiveUpdateKey(updateId, Boolean(body?.isKey));
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { updateId } = await params;
  const g = await guard(updateId);
  if ("error" in g) return g.error;

  if (!(await deleteLiveUpdate(updateId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await logActivity({
    action: "live.deleted",
    editorId: g.me.id,
    editorName: g.me.name,
    target: g.article.title,
    targetId: g.article.id,
  });
  return NextResponse.json({ ok: true });
}
