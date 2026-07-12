import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import NewsletterSignup from "@/components/NewsletterSignup";
import VideoCard from "@/components/VideoCard";
import { getBreaking, getVideoById, getVideosByShow, getVideos, incrementVideoViews } from "@/lib/store";
import { compact, timeAgo } from "@/lib/format";
import { videoThumb } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoById(id);
  if (!video) return { title: "Video not found" };
  return { title: `${video.title} — Gh News TV` };
}

export default async function VideoWatchPage({ params }: Props) {
  const { id } = await params;
  const video = await getVideoById(id);
  if (!video) notFound();

  await incrementVideoViews(video.id);

  const more = (await getVideosByShow(video.show))
    .filter((v) => v.id !== video.id)
    .slice(0, 4);
  const others =
    more.length > 0
      ? more
      : (await getVideos()).filter((v) => v.id !== video.id).slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <SiteHeader />
      <BreakingTicker articles={await getBreaking()} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative aspect-video bg-black border border-white/10 overflow-hidden">
            {video.youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 20%, #cc000055, transparent 60%), radial-gradient(ellipse at 80% 80%, #1d4ed855, transparent 60%)",
                }}
              >
                <span className="text-white/10 font-black text-6xl select-none">
                  GH
                </span>
              </div>
            )}
          </div>

          <div className="mt-5">
            <Link
              href={`/video?show=${encodeURIComponent(video.show)}`}
              className="inline-block text-[11px] font-semibold tracking-[0.14em] uppercase text-white/55 hover:text-white transition-colors mb-2"
            >
              {video.show}
            </Link>
            <h1 className="headline text-2xl md:text-3xl leading-tight">
              {video.title}
            </h1>
            <p className="text-white/50 text-sm mt-3">
              {compact(video.views)} views · {timeAgo(video.publishedAt)} · {video.duration}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Link
              href="/video"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              ← Back to Gh News TV
            </Link>
          </div>
        </div>

        {/* More videos rail */}
        <aside className="bg-white/5 border border-white/10 p-5 h-fit">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1.5 h-6 bg-brand"></span>
            <h2 className="font-semibold text-sm uppercase tracking-wide">
              More from {video.show}
            </h2>
          </div>
          <div className="space-y-5">
            {others.map((v) => (
              <Link key={v.id} href={`/video/${v.id}`} className="group flex gap-3">
                <div className="w-32 shrink-0">
                  <div className="relative aspect-video overflow-hidden bg-neutral-800">
                    {videoThumb(v) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={videoThumb(v)!}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background:
                            "radial-gradient(ellipse at 30% 20%, #cc000044, transparent 60%), #16161a",
                        }}
                      />
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                      {v.duration}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-snug group-hover:text-brand transition-colors line-clamp-2">
                    {v.title}
                  </h3>
                  <p className="text-[11px] text-white/40 mt-1">
                    {compact(v.views)} views
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </main>

      {/* Related grid on light background, matching the rest of the site */}
      <div className="bg-neutral-light text-ink">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-hairline-strong">
            <span className="w-1.5 h-6 bg-brand"></span>
            <h2 className="font-semibold text-xl uppercase tracking-wide text-ink">
              Watch More
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {(await getVideos())
              .filter((v) => v.id !== video.id)
              .slice(0, 4)
              .map((v) => (
                <VideoCard key={v.id} video={v} size="sm" />
              ))}
          </div>
        </div>
      </div>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
