import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import NewsletterSignup from "@/components/NewsletterSignup";
import VideoCard, { VideoThumb } from "@/components/VideoCard";
import { getBreaking, getVideos } from "@/lib/store";
import { VIDEO_SHOWS } from "@/lib/types";
import { compact, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Video — Gh News TV" };

export default async function VideoHubPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show } = await searchParams;
  const videos = await getVideos();
  const featured = videos.find((v) => v.featured) ?? videos[0];
  const rest = videos.filter((v) => v.id !== featured?.id);
  const filtered = show ? rest.filter((v) => v.show === show) : rest;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <SiteHeader />
      <BreakingTicker articles={await getBreaking()} />

      <main className="flex-1 w-full">
        {/* Hero band */}
        <div className="bg-ink text-white">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 bg-brand px-3 py-1 font-semibold text-xs tracking-[0.16em] uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Gh News TV
              </span>
              <h1 className="font-semibold text-2xl uppercase tracking-wide">
                Video
              </h1>
            </div>

            {featured && (
              <Link href={`/video/${featured.id}`} className="group grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="border border-white/10">
                  <VideoThumb video={featured} />
                </div>
                <div>
                  <span className="inline-block text-[10px] font-semibold tracking-[0.14em] uppercase text-white/60 mb-2">
                    {featured.show}
                  </span>
                  <h2 className="headline text-2xl md:text-3xl leading-tight group-hover:text-white/80 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-white/45 text-sm mt-3">
                    {compact(featured.views)} views · {timeAgo(featured.publishedAt)}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Show filter chips */}
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Link
              href="/video"
              className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                !show
                  ? "bg-brand text-white"
                  : "bg-neutral-100 text-neutral-gray hover:bg-neutral-200"
              }`}
            >
              All Shows
            </Link>
            {VIDEO_SHOWS.map((s) => (
              <Link
                key={s}
                href={`/video?show=${encodeURIComponent(s)}`}
                className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  show === s
                    ? "bg-brand text-white"
                    : "bg-neutral-100 text-neutral-gray hover:bg-neutral-200"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          {filtered.length === 0 ? (
            <p className="text-neutral-gray text-center py-16">
              No videos in this show yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filtered.map((v) => (
                <VideoCard key={v.id} video={v} size="sm" />
              ))}
            </div>
          )}
        </div>
      </main>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
