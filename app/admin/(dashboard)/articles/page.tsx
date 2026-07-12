import ArticlesManager from "@/components/admin/ArticlesManager";
import { getAll, getSections } from "@/lib/store";
import { previewToken } from "@/lib/auth";
import { isArticleLive } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await getAll();

  // Only unpublished stories need a preview link; signed here on the server.
  const previewTokens: Record<string, string> = {};
  for (const a of articles) {
    if (!isArticleLive(a)) previewTokens[a.id] = previewToken(a.id);
  }

  return (
    <ArticlesManager
      initial={articles}
      sections={await getSections()}
      previewTokens={previewTokens}
    />
  );
}
