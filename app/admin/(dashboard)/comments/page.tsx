import { redirect } from "next/navigation";
import CommentsManager from "@/components/admin/CommentsManager";
import { getCurrentEditor } from "@/lib/auth";
import { getAllComments, getAll, getModerationSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");

  const articles = getAll().map((a) => ({ id: a.id, title: a.title, slug: a.slug }));

  return (
    <CommentsManager
      initial={getAllComments()}
      articles={articles}
      moderation={getModerationSettings()}
      isAdmin={me.role === "admin"}
    />
  );
}
