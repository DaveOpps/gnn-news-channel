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
  const cat = getSections().find((c) => c.slug === slug);
  if (!cat) notFound();

  const articles = getByCategory(slug);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <SiteHeader />
      <BreakingTicker articles={getBreaking()} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-10">
        <div
          className="text-white px-6 py-8 mb-8"
          style={{ background: `linear-gradient(120deg, ${cat.color}, #16161a)` }}
        >
          <h1 className="font-black text-3xl md:text-4xl uppercase tracking-wide">
            {cat.label}
          </h1>
          <p className="text-white/70 text-sm mt-2">
            {articles.length} {articles.length === 1 ? "story" : "stories"} · GNN{" "}
            {cat.label} desk
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-neutral-500 py-16 text-center">
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
