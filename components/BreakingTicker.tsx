import Link from "next/link";
import { Article } from "@/lib/types";

export default function BreakingTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  // duplicate the list so the CSS loop is seamless
  const loop = [...articles, ...articles];

  return (
    <div className="bg-brand text-white flex items-stretch overflow-hidden shadow-md border-b-2 border-brand-accent">
      <div className="bg-neutral-dark px-6 py-3 flex items-center gap-3 shrink-0 z-10">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-accent"></span>
        </span>
        <span className="font-black text-xs tracking-[0.3em] uppercase text-brand-accent">⚡ LIVE</span>
      </div>
      <div className="flex-1 overflow-hidden flex items-center">
        <div className="ticker-track">
          {loop.map((a, i) => (
            <Link
              key={`${a.id}-${i}`}
              href={`/article/${a.slug}`}
              className="px-8 text-sm font-bold hover:text-brand-accent transition-colors underline-offset-2 hover:underline flex items-center gap-3 whitespace-nowrap"
            >
              <span className="text-brand-accent">●</span>
              {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
