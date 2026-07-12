import ArticleForm from "@/components/admin/ArticleForm";
import { getSections } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  return <ArticleForm sections={await getSections()} />;
}
