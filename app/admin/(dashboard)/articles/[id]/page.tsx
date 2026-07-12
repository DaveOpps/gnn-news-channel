import { notFound } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import { getById, getSections } from "@/lib/store";
import { getCurrentEditor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getById(id);
  if (!article) notFound();
  const me = await getCurrentEditor();
  return (
    <ArticleForm
      article={article}
      sections={await getSections()}
      canDeleteCorrections={me?.role === "admin"}
    />
  );
}
