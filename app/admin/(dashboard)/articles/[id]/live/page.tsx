import { notFound, redirect } from "next/navigation";
import LiveConsole from "@/components/admin/LiveConsole";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import { getById, getLiveUpdates } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LiveConsolePage({
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
    <LiveConsole
      article={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        isLiveBlog: article.isLiveBlog,
      }}
      initial={getLiveUpdates(article.id)}
    />
  );
}
