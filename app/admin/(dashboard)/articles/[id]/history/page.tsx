import { notFound, redirect } from "next/navigation";
import RevisionHistory from "@/components/admin/RevisionHistory";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import { getById, getRevisions } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");

  const { id } = await params;
  const article = getById(id);
  if (!article || article.deletedAt) notFound();
  if (!canEditArticle(me, article)) redirect("/admin/articles");

  return (
    <RevisionHistory
      article={{
        id: article.id,
        title: article.title,
        body: article.body,
        slug: article.slug,
      }}
      revisions={getRevisions(article.id)}
    />
  );
}
