import Link from "next/link";
import { Article } from "@/lib/types";

export default function BreakingTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  // duplicate the list so the CSS loop is seamless
  const loop = [...articles, ...articles];

  return (
    <div className="bg-brand text-white flex items-stretch overflow-hidden">
      <div className="bg-ink px-4 py-2 flex items-center gap-2 shrink-0 z-10">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <span className="font-black text-xs tracking-[0.2em] uppercase">Breaking</span>
      </div>
      <div className="flex-1 overflow-hidden flex items-center">
        <div className="ticker-track">
          {loop.map((a, i) => (
            <Link
              key={`${a.id}-${i}`}
              href={`/article/${a.slug}`}
              className="px-8 text-sm font-semibold hover:underline underline-offset-2 flex items-center gap-3"
            >
              <span className="text-white/60">●</span>
              {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
