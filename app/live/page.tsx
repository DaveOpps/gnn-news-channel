import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import NewsletterSignup from "@/components/NewsletterSignup";
import { CategoryBadge, ByBadge, timeAgo } from "@/components/ArticleCard";
import { getBreaking, getPublished } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Live TV" };

export default async function LivePage() {
  const breaking = await getBreaking();
  const latest = (await getPublished()).slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <SiteHeader />
      <BreakingTicker articles={breaking} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Player */}
        <div className="lg:col-span-2">
          <div className="relative aspect-video bg-black border border-white/10 overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 20%, #cc000055, transparent 60%), radial-gradient(ellipse at 80% 80%, #1d4ed855, transparent 60%)",
              }}
            />
            <div className="relative z-10 text-center px-6">
              <span className="inline-flex items-center gap-2 bg-brand px-3 py-1.5 font-bold text-xs tracking-[0.18em] uppercase mb-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                Live
              </span>
              <h1 className="headline text-3xl md:text-4xl">Ghana Newspapers Live Newsroom</h1>
              <p className="text-white/60 text-sm mt-3 max-w-md mx-auto">
                Our 24-hour live stream is coming soon. Until then, follow the
                breaking ticker and the latest headlines on the right.
              </p>
              <div className="mt-8 flex items-center justify-center">
                <span className="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center hover:border-brand hover:scale-105 transition-all cursor-pointer">
                  <span className="ml-1 w-0 h-0 border-y-[14px] border-y-transparent border-l-[22px] border-l-white"></span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-white/50">
            <span>Ghana Newspapers International · Live signal</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              On air
            </span>
          </div>
        </div>

        {/* Live headlines rail */}
        <aside className="bg-white/5 border border-white/10 p-5 h-fit">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1.5 h-6 bg-brand"></span>
            <h2 className="font-semibold text-sm uppercase tracking-wide">
              Happening Now
            </h2>
          </div>
          <ul className="divide-y divide-white/10">
            {latest.map((a) => (
              <li key={a.id} className="py-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <CategoryBadge category={a.category} />
                  <span className="text-[11px] text-white/40">
                    {timeAgo(a.publishedAt)}
                  </span>
                </div>
                <Link
                  href={`/article/${a.slug}`}
                  className="font-semibold text-sm leading-snug hover:text-brand transition-colors"
                >
                  {a.title}
                </Link>
                <div className="mt-1.5">
                  <ByBadge article={a} nameClassName="text-white/50" />
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
