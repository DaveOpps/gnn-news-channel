import Link from "next/link";
import { Article } from "@/lib/types";

export default function BreakingTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  // duplicate the list so the CSS loop is seamless
  const loop = [...articles, ...articles];

  return (
    <div className="bg-ink text-white flex items-stretch overflow-hidden border-b border-white/10">
      <div className="bg-brand px-5 py-2.5 flex items-center gap-2 shrink-0 z-10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="font-bold text-[11px] tracking-[0.16em] uppercase">
          Breaking
        </span>
      </div>
      <div className="flex-1 overflow-hidden flex items-center">
        <div className="ticker-track">
          {loop.map((a, i) => (
            <Link
              key={`${a.id}-${i}`}
              href={`/article/${a.slug}`}
              className="px-7 text-sm font-medium text-white/90 hover:text-white transition-colors flex items-center gap-2.5 whitespace-nowrap"
            >
              <span className="text-white/30">●</span>
              {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
