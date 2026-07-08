import ArticlesManager from "@/components/admin/ArticlesManager";
import { getAll } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminArticlesPage() {
  return <ArticlesManager initial={getAll()} />;
}
