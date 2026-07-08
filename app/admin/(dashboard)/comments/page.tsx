import CommentsManager from "@/components/admin/CommentsManager";
import { getAllComments, getAll } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminCommentsPage() {
  const articles = getAll().map((a) => ({ id: a.id, title: a.title, slug: a.slug }));
  return <CommentsManager initial={getAllComments()} articles={articles} />;
}
