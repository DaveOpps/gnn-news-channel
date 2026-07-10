import ArticlesManager from "@/components/admin/ArticlesManager";
import { getAll } from "@/lib/store";
import { previewToken } from "@/lib/auth";
import { isArticleLive } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminArticlesPage() {
  const articles = getAll();

  // Only unpublished stories need a preview link; signed here on the server.
  const previewTokens: Record<string, string> = {};
  for (const a of articles) {
    if (!isArticleLive(a)) previewTokens[a.id] = previewToken(a.id);
  }

  return <ArticlesManager initial={articles} previewTokens={previewTokens} />;
}
