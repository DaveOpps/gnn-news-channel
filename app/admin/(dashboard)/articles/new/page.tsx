import ArticleForm from "@/components/admin/ArticleForm";
import { getSections } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
  return <ArticleForm sections={getSections()} />;
}
