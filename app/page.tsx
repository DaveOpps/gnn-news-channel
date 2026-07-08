import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard, { CategoryBadge, timeAgo } from "@/components/ArticleCard";
import ArticleImage from "@/components/ArticleImage";
import NewsletterSignup from "@/components/NewsletterSignup";
import TrendingStories from "@/components/TrendingStories";
import CategorySection from "@/components/CategorySection";
import { getPublished, getBreaking, getFeatured, getTrending } from "@/lib/store";
import { CATEGORIES, formatByline } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const published = getPublished();
  const breaking = getBreaking();
  const trending = getTrending(6);

  const featured = getFeatured();
  const hero = featured[0] ?? published[0];
  const heroSide = published.filter((a) => a.id !== hero?.id).slice(0, 4);
  const latest = published.filter((a) => a.id !== hero?.id).slice(4, 10);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <BreakingTicker articles={breaking} />

      <main className="flex-1 w-full">
        {/* ---- Hero Section ---- */}
        {hero && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Hero */}
              <article className="lg:col-span-2 group relative overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <Link href={`/article/${hero.slug}`} className="block aspect-[16/9]">
                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-110 overflow-hidden">
                    <ArticleImage article={hero} />
                  </div>
                </Link>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/98 via-black/80 to-transparent p-8 pt-32 pointer-events-none">
                  <div className="pointer-events-auto">
                    <CategoryBadge category={hero.category} />
                    <Link href={`/article/${hero.slug}`}>
                      <h1 className="text-white font-black text-3xl md:text-5xl leading-tight mt-4 hover:text-brand-accent transition-colors">
                        {hero.title}
                      </h1>
                    </Link>
                    <p className="text-white/80 text-sm md:text-base mt-4 max-w-2xl line-clamp-3 font-medium">
                      {hero.excerpt}
                    </p>
                    <p className="text-white/60 text-xs mt-4 font-medium">
                      {formatByline(hero.author, hero.coAuthors)} · {timeAgo(hero.publishedAt)}
                    </p>
                  </div>
                </div>
              </article>

              {/* Top Stories Sidebar */}
              <div className="flex flex-col bg-white shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-brand to-brand-dark text-white px-6 py-4">
                  <h2 className="font-black text-xs tracking-[0.2em] uppercase">⭐ Top Stories</h2>
                </div>
                <div className="flex-1 divide-y divide-neutral-200">
                  {heroSide.map((a) => (
                    <article key={a.id} className="p-5 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryBadge category={a.category} />
                        <span className="text-[10px] font-bold text-brand">
                          {timeAgo(a.publishedAt)}
                        </span>
                      </div>
                      <Link href={`/article/${a.slug}`} className="headline-link group">
                        <h3 className="font-bold text-sm leading-snug group-hover:text-brand transition-colors">
                          {a.title}
                        </h3>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- Latest + Trending ---- */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-4 mb-8 pb-4 border-b-4 border-brand">
                <div className="w-2 h-10 bg-gradient-to-b from-brand to-brand-dark"></div>
                <h2 className="font-black text-2xl uppercase tracking-wide text-neutral-dark">
                  Latest News
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {latest.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>

            {/* Trending Sidebar */}
            <TrendingStories articles={trending} />
          </div>
        </section>

        {/* ---- Editor's Picks ---- */}
        {featured.length > 1 && (
          <section className="bg-gradient-to-r from-neutral-dark to-neutral-dark text-white py-16 my-12 border-t-4 border-brand-accent">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-2 h-10 bg-brand-accent"></div>
                <h2 className="font-black text-2xl uppercase tracking-wide">
                  ✨ Editor&apos;s Picks
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featured.slice(0, 3).map((a, i) => (
                  <article key={a.id} className="flex gap-4 items-start bg-white/5 p-6 hover:bg-white/10 transition-colors rounded">
                    <span className="font-black text-5xl text-white/15 leading-none flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <CategoryBadge category={a.category} />
                      <Link href={`/article/${a.slug}`}>
                        <h3 className="font-black leading-snug mt-3 hover:text-brand-accent transition-colors text-lg">
                          {a.title}
                        </h3>
                      </Link>
                      <p className="text-white/50 text-xs mt-3 font-medium">
                        {formatByline(a.author, a.coAuthors)} · {timeAgo(a.publishedAt)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---- Category sections ---- */}
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
          {CATEGORIES.map((cat) => {
            const items = published
              .filter((a) => a.category === cat.slug)
              .slice(0, 4);
            return <CategorySection key={cat.slug} category={cat} articles={items} />;
          })}
        </div>
      </main>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
