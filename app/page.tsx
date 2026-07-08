import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard, { CategoryBadge, timeAgo } from "@/components/ArticleCard";
import ArticleImage from "@/components/ArticleImage";
import NewsletterSignup from "@/components/NewsletterSignup";
import { getPublished, getBreaking, getFeatured, getTrending } from "@/lib/store";
import { CATEGORIES } from "@/lib/types";

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
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <SiteHeader />
      <BreakingTicker articles={breaking} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* ---- Hero ---- */}
        {hero && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <article className="lg:col-span-2 group relative overflow-hidden bg-white shadow-sm">
              <Link href={`/article/${hero.slug}`} className="block aspect-[16/9]">
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <ArticleImage article={hero} />
                </div>
              </Link>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-6 pt-24 pointer-events-none">
                <div className="pointer-events-auto">
                  <CategoryBadge category={hero.category} />
                  <Link href={`/article/${hero.slug}`}>
                    <h1 className="text-white font-black text-2xl md:text-4xl leading-tight mt-3 hover:underline underline-offset-4">
                      {hero.title}
                    </h1>
                  </Link>
                  <p className="text-white/80 text-sm md:text-base mt-3 max-w-2xl line-clamp-2">
                    {hero.excerpt}
                  </p>
                  <p className="text-white/50 text-xs mt-3">
                    By {hero.author} · {timeAgo(hero.publishedAt)}
                  </p>
                </div>
              </div>
            </article>

            <div className="flex flex-col divide-y divide-neutral-200 bg-white shadow-sm px-5">
              <h2 className="font-black text-xs tracking-[0.2em] uppercase text-brand pt-4 pb-2">
                Top Stories
              </h2>
              {heroSide.map((a) => (
                <article key={a.id} className="py-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CategoryBadge category={a.category} />
                    <span className="text-[11px] text-neutral-500">
                      {timeAgo(a.publishedAt)}
                    </span>
                  </div>
                  <Link href={`/article/${a.slug}`} className="headline-link">
                    <h3 className="font-bold leading-snug">{a.title}</h3>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ---- Latest + Trending ---- */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-brand"></span>
              <h2 className="font-black text-xl uppercase tracking-wide">Latest News</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latest.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>

          <aside>
            <div className="bg-white shadow-sm p-5 sticky top-32">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1.5 h-6 bg-brand"></span>
                <h2 className="font-black text-sm uppercase tracking-wide">Trending Now</h2>
              </div>
              <ol className="space-y-4">
                {trending.map((a, i) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="text-3xl font-black text-neutral-200 leading-none">
                      {i + 1}
                    </span>
                    <div>
                      <Link href={`/article/${a.slug}`} className="headline-link">
                        <h3 className="text-sm font-bold leading-snug">{a.title}</h3>
                      </Link>
                      <span className="text-[11px] text-neutral-500">
                        {a.views.toLocaleString()} views
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </section>

        {/* ---- Editor's Picks ---- */}
        {featured.length > 1 && (
          <section className="mb-12 bg-ink text-white p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-brand"></span>
              <h2 className="font-black text-xl uppercase tracking-wide">
                Editor&apos;s Picks
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.slice(0, 3).map((a, i) => (
                <article key={a.id} className="flex gap-4 items-start">
                  <span className="font-black text-4xl text-white/15 leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <CategoryBadge category={a.category} />
                    <Link href={`/article/${a.slug}`}>
                      <h3 className="font-bold leading-snug mt-2 hover:text-red-400 transition-colors">
                        {a.title}
                      </h3>
                    </Link>
                    <p className="text-white/50 text-xs mt-2">
                      By {a.author} · {timeAgo(a.publishedAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ---- Category sections ---- */}
        {CATEGORIES.map((cat) => {
          const items = published.filter((a) => a.category === cat.slug).slice(0, 4);
          if (items.length === 0) return null;
          return (
            <section key={cat.slug} className="mb-12">
              <div className="flex items-center justify-between mb-6 border-b-2 border-neutral-200 pb-2">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6" style={{ backgroundColor: cat.color }}></span>
                  <h2 className="font-black text-xl uppercase tracking-wide">{cat.label}</h2>
                </div>
                <Link
                  href={`/category/${cat.slug}`}
                  className="text-sm font-semibold text-brand hover:underline underline-offset-2"
                >
                  See all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((a) => (
                  <ArticleCard key={a.id} article={a} size="sm" />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
