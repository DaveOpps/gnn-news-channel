import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard from "@/components/ArticleCard";
import { searchArticles, getBreaking } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchArticles(query) : [];

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <SiteHeader />
      <BreakingTicker articles={await getBreaking()} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-10">
        <h1 className="headline text-3xl mb-2 text-ink">Search</h1>
        <form action="/search" className="mb-8 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search headlines, stories, tags…"
            className="w-full border border-hairline-strong rounded-full px-5 py-3 text-base focus:outline-none focus:border-brand"
          />
        </form>

        {query && (
          <p className="text-neutral-gray mb-8">
            {results.length} {results.length === 1 ? "result" : "results"} for{" "}
            <strong className="text-ink">&ldquo;{query}&rdquo;</strong>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
