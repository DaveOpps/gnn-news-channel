import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard, { CategoryBadge, ByBadge, timeAgo } from "@/components/ArticleCard";
import ArticleImage from "@/components/ArticleImage";
import NewsletterSignup from "@/components/NewsletterSignup";
import TrendingStories from "@/components/TrendingStories";
import CategorySection from "@/components/CategorySection";
import VideoCard from "@/components/VideoCard";
import {
  getPublished,
  getBreaking,
  getFeatured,
  getTrending,
  getHomepage,
  getSections,
  getVideos,
} from "@/lib/store";
import { formatByline } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const published = await getPublished();
  const breaking = await getBreaking();
  const trending = await getTrending(6);
  const featured = await getFeatured();

  // Honours the curation board, falling back to automatic ordering.
  const { hero, topStories: heroSide, latest } = await getHomepage();
  const CATEGORIES = await getSections();
  const videos = (await getVideos()).slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <BreakingTicker articles={breaking} />

      <main className="flex-1 w-full">
        {/* ---- Hero Section ---- */}
        {hero && (
          <section className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Hero */}
              <article className="lg:col-span-2 group relative overflow-hidden bg-white border border-hairline-strong">
                <Link href={`/article/${hero.slug}`} className="block aspect-[16/9]">
                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                    <ArticleImage article={hero} />
                  </div>
                </Link>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-8 pt-28 pointer-events-none">
                  <div className="pointer-events-auto">
                    {hero.isLiveBlog && (
                      <span className="mr-2 inline-flex items-center gap-1.5 bg-brand px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        Live
                      </span>
                    )}
                    <CategoryBadge category={hero.category} />
                    <Link href={`/article/${hero.slug}`}>
                      <h1 className="headline text-white text-3xl md:text-5xl leading-tight mt-4 hover:text-white/85 transition-colors">
                        {hero.title}
                      </h1>
                    </Link>
                    <p className="text-white/75 text-sm md:text-base mt-4 max-w-2xl line-clamp-3">
                      {hero.excerpt}
                    </p>
                    <p className="text-white/55 text-xs mt-4">
                      {formatByline(hero.author, hero.coAuthors)} · {timeAgo(hero.publishedAt)}
                    </p>
                  </div>
                </div>
              </article>

              {/* Top Stories Sidebar */}
              <div className="flex flex-col bg-white border border-hairline-strong overflow-hidden">
                <div className="bg-ink text-white px-5 py-3.5">
                  <h2 className="font-semibold text-xs tracking-[0.16em] uppercase">Top Stories</h2>
                </div>
                <div className="flex-1 divide-y divide-hairline">
                  {heroSide.map((a) => (
                    <article key={a.id} className="p-4 hover:bg-paper transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryBadge category={a.category} />
                        <span className="text-[10px] font-medium text-neutral-gray">
                          {timeAgo(a.publishedAt)}
                        </span>
                      </div>
                      <Link href={`/article/${a.slug}`} className="headline-link group">
                        <h3 className="font-semibold text-sm leading-snug text-ink group-hover:text-brand transition-colors">
                          {a.title}
                        </h3>
                      </Link>
                      <div className="mt-2">
                        <ByBadge article={a} />
                      </div>
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
              <div className="flex items-center gap-3 mb-7 pb-3 border-b border-hairline-strong">
                <span className="w-1.5 h-6 bg-brand"></span>
                <h2 className="font-semibold text-xl uppercase tracking-wide text-ink">
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
          <section className="bg-ink text-white py-14 my-4">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-3 mb-9">
                <span className="w-1.5 h-6 bg-brand"></span>
                <h2 className="font-semibold text-xl uppercase tracking-wide">
                  Editor&apos;s Picks
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featured.slice(0, 3).map((a, i) => (
                  <article key={a.id} className="flex gap-4 items-start">
                    <span className="font-bold text-4xl text-white/15 leading-none shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <CategoryBadge category={a.category} />
                      <Link href={`/article/${a.slug}`}>
                        <h3 className="headline leading-snug mt-3 hover:text-white/80 transition-colors text-lg">
                          {a.title}
                        </h3>
                      </Link>
                      <p className="text-white/45 text-xs mt-3">
                        {formatByline(a.author, a.coAuthors)} · {timeAgo(a.publishedAt)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---- Ghana Newspapers TV ---- */}
        {videos.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-7 pb-3 border-b border-hairline-strong">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-brand"></span>
                <h2 className="font-semibold text-xl uppercase tracking-wide text-ink flex items-center gap-2.5">
                  Ghana Newspapers TV
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                  </span>
                </h2>
              </div>
              <Link
                href="/video"
                className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
              >
                Watch all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} size="sm" />
              ))}
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
