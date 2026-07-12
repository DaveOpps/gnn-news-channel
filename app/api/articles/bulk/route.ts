import { NextResponse } from "next/server";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import {
  getById,
  updateArticle,
  trashArticle,
  recordArticleAction,
  logActivity,
} from "@/lib/store";
import { BulkAction } from "@/lib/types";

const ACTIONS: BulkAction[] = ["publish", "unpublish", "trash", "feature", "unfeature"];

/**
 * Apply one action across many stories. Permission is checked per story, so a
 * plain editor's bulk select silently skips anything that isn't theirs rather
 * than failing the whole batch.
 */
export async function POST(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "") as BulkAction;
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String) : [];

  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "No stories selected" }, { status: 400 });
  }

  let updated = 0;
  let skipped = 0;

  for (const id of ids) {
    const article = await getById(id);
    if (!article || article.deletedAt || !canEditArticle(me, article)) {
      skipped++;
      continue;
    }

    if (action === "trash") {
      if (await trashArticle(id)) {
        await recordArticleAction("article.trashed", me, article);
        updated++;
      } else skipped++;
      continue;
    }

    const patch =
      action === "publish"
        ? { status: "published" as const }
        : action === "unpublish"
          ? { status: "draft" as const }
          : action === "feature"
            ? { isFeatured: true }
            : { isFeatured: false };

    const result = await updateArticle(id, patch);
    if (result) {
      if (action === "publish") await recordArticleAction("article.published", me, result);
      if (action === "unpublish") await recordArticleAction("article.unpublished", me, result);
      updated++;
    } else skipped++;
  }

  await logActivity({
    action: "article.updated",
    editorId: me.id,
    editorName: me.name,
    target: `${updated} ${updated === 1 ? "story" : "stories"}`,
    detail: `bulk ${action}${skipped ? ` · ${skipped} skipped` : ""}`,
  });

  return NextResponse.json({ updated, skipped });
}
