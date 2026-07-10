import Link from "next/link";
import { Video, videoThumb } from "@/lib/types";
import { compact, timeAgo } from "@/lib/format";

function PlayBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "w-10 h-10", md: "w-14 h-14", lg: "w-20 h-20" }[size];
  const tri = { sm: "border-y-[6px] border-l-[10px]", md: "border-y-[9px] border-l-[14px]", lg: "border-y-[14px] border-l-[22px]" }[size];
  return (
    <span
      className={`${dims} rounded-full bg-brand/90 flex items-center justify-center group-hover:bg-brand group-hover:scale-110 transition-all shadow-lg`}
    >
      <span
        className={`ml-0.5 w-0 h-0 border-y-transparent border-l-white ${tri}`}
      ></span>
    </span>
  );
}

export function VideoThumb({ video }: { video: Video }) {
  const thumb = videoThumb(video);
  return (
    <div className="relative aspect-video overflow-hidden bg-neutral-dark">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, #cc000055, transparent 60%), radial-gradient(ellipse at 80% 80%, #1d4ed855, transparent 60%), #16161a",
          }}
        >
          <span className="text-white/10 font-black text-5xl select-none">
            GNN
          </span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
        <PlayBadge />
      </div>
      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
        {video.duration}
      </span>
      {video.featured && (
        <span className="absolute top-2 left-2 bg-brand text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
          Featured
        </span>
      )}
    </div>
  );
}

export default function VideoCard({
  video,
  size = "md",
}: {
  video: Video;
  size?: "sm" | "md";
}) {
  return (
    <Link href={`/video/${video.id}`} className="group block">
      <VideoThumb video={video} />
      <div className="pt-3">
        <span className="inline-block text-[10px] font-black tracking-[0.15em] uppercase text-brand mb-1.5">
          {video.show}
        </span>
        <h3
          className={`font-bold leading-snug text-ink group-hover:text-brand transition-colors ${
            size === "sm" ? "text-sm" : "text-base"
          }`}
        >
          {video.title}
        </h3>
        <p className="text-xs text-neutral-500 mt-1.5 font-medium">
          {compact(video.views)} views · {timeAgo(video.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
