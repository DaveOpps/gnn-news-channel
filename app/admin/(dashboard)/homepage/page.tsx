import { redirect } from "next/navigation";
import CurationBoard from "@/components/admin/CurationBoard";
import { getCurrentEditor } from "@/lib/auth";
import { getCuration, getHomepage, getPublished, getSections } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");
  // The front page is the shop window — admins only.
  if (me.role !== "admin") redirect("/admin");

  const curation = await getCuration();
  const { isCurated } = await getHomepage();

  const published = (await getPublished()).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    category: a.category,
    isFeatured: a.isFeatured,
    isLiveBlog: a.isLiveBlog,
  }));

  return (
    <CurationBoard
      published={published}
      initialHeroId={curation?.heroId}
      initialTopIds={curation?.topStoryIds ?? []}
      isCurated={isCurated}
      sections={await getSections()}
    />
  );
}
