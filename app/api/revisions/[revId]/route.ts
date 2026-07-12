import { NextResponse } from "next/server";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import {
  getRevisionById,
  getById,
  updateArticle,
  addRevision,
  recordArticleAction,
} from "@/lib/store";

type Params = { params: Promise<{ revId: string }> };

/**
 * Roll a story back to an earlier revision. The current state is snapshotted
 * first, so a restore is itself undoable — you can never lose the present.
 */
export async function POST(_req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { revId } = await params;
  const revision = await getRevisionById(revId);
  if (!revision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const article = await getById(revision.articleId);
  if (!article || article.deletedAt) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (!canEditArticle(me, article)) {
    return NextResponse.json(
      { error: "This story belongs to another editor" },
      { status: 403 }
    );
  }

  await addRevision(article, me);

  const updated = await updateArticle(article.id, {
    title: revision.title,
    slug: revision.slug,
    excerpt: revision.excerpt,
    body: revision.body,
    category: revision.category,
    tags: revision.tags,
    imageUrl: revision.imageUrl,
    metaDescription: revision.metaDescription,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recordArticleAction(
    "article.updated",
    me,
    updated,
    `restored the version from ${new Date(revision.at).toLocaleString()}`
  );

  return NextResponse.json(updated);
}
