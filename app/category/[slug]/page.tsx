import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard from "@/components/ArticleCard";
import { getByCategory, getBreaking } from "@/lib/store";
import { getSections } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = (await getSections()).find((c) => c.slug === slug);
  if (!cat) notFound();

  const articles = await getByCategory(slug);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <SiteHeader />
      <BreakingTicker articles={await getBreaking()} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-10">
        <div className="px-1 py-8 mb-8 border-b-2" style={{ borderColor: cat.color }}>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-8" style={{ backgroundColor: cat.color }}></span>
            <h1 className="headline text-3xl md:text-4xl text-ink">
              {cat.label}
            </h1>
          </div>
          <p className="text-neutral-gray text-sm mt-2 ml-[22px]">
            {articles.length} {articles.length === 1 ? "story" : "stories"} · Ghana Newspapers{" "}
            {cat.label} desk
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-neutral-gray py-16 text-center">
            No stories in this section yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
