import Link from "next/link";
import type { Article } from "@/lib/types";
import { timeAgo } from "./ArticleCard";

interface TrendingStoriesProps {
  articles: Article[];
}

export default function TrendingStories({ articles }: TrendingStoriesProps) {
  return (
    <aside className="sticky top-32">
      <div className="bg-white border border-hairline-strong p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-hairline">
          <span className="w-1.5 h-6 bg-brand"></span>
          <h2 className="font-semibold text-sm uppercase tracking-[0.14em] text-ink">
            Trending Now
          </h2>
        </div>
        <ol className="space-y-5">
          {articles.map((a, i) => (
            <li key={a.id} className="flex gap-3">
              <span className="text-3xl font-bold text-hairline-strong leading-none shrink-0 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <Link href={`/article/${a.slug}`} className="group">
                  <h3 className="text-sm font-semibold leading-snug text-ink group-hover:text-brand transition-colors line-clamp-2">
                    {a.title}
                  </h3>
                </Link>
                <p className="text-neutral-gray text-xs mt-1">
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
