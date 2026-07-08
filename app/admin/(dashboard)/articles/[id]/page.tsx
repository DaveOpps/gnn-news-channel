import { notFound } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import { getById } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getById(id);
  if (!article) notFound();
  return <ArticleForm article={article} />;
}
