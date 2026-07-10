import { NextResponse } from "next/server";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import { getById, restoreArticle, purgeArticle, recordArticleAction } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

/** Restore a trashed story back to its previous status. */
export async function POST(_req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = getById(id);
  if (!existing || !existing.deletedAt) {
    return NextResponse.json({ error: "Not in trash" }, { status: 404 });
  }
  if (!canEditArticle(me, existing)) {
    return NextResponse.json(
      { error: "This story belongs to another editor" },
      { status: 403 }
    );
  }

  const restored = restoreArticle(id);
  if (!restored) return NextResponse.json({ error: "Not in trash" }, { status: 404 });

  recordArticleAction("article.restored", me, restored);
  return NextResponse.json(restored);
}

/** Permanently destroy a trashed story and its comments. Admins only. */
export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can permanently delete a story" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const existing = getById(id);
  if (!existing || !existing.deletedAt) {
    return NextResponse.json({ error: "Not in trash" }, { status: 404 });
  }

  if (!purgeArticle(id)) {
    return NextResponse.json({ error: "Not in trash" }, { status: 404 });
  }
  recordArticleAction("article.purged", me, existing);
  return NextResponse.json({ ok: true });
}
