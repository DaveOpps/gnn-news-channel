import Link from "next/link";
import type { Article } from "@/lib/types";
import { timeAgo } from "./ArticleCard";

interface TrendingStoriesProps {
  articles: Article[];
}

export default function TrendingStories({ articles }: TrendingStoriesProps) {
  return (
    <aside className="sticky top-32">
      <div className="bg-gradient-to-b from-brand to-brand-dark text-white shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-brand-accent"></div>
          <h2 className="font-black text-base uppercase tracking-widest">
            🔥 Trending Now
          </h2>
        </div>
        <ol className="space-y-4">
          {articles.map((a, i) => (
            <li key={a.id} className="flex gap-3 pb-4 border-b border-white/20 last:border-b-0 last:pb-0">
              <span className="text-4xl font-black text-white/30 leading-none flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <Link href={`/article/${a.slug}`} className="group">
                  <h3 className="text-sm font-bold leading-snug group-hover:text-brand-accent transition-colors line-clamp-2">
                    {a.title}
                  </h3>
                </Link>
                <p className="text-white/70 text-xs mt-1">
                  {a.views.toLocaleString()} views
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
