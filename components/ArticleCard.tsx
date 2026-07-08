import Link from "next/link";
import { Article, categoryMeta } from "@/lib/types";
import ArticleImage from "./ArticleImage";

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CategoryBadge({ category }: { category: string }) {
  const meta = categoryMeta(category);
  return (
    <Link
      href={`/category/${meta.slug}`}
      className="inline-block text-[10px] font-black tracking-[0.15em] uppercase text-white px-2 py-0.5"
      style={{ backgroundColor: meta.color }}
    >
      {meta.label}
    </Link>
  );
}

export default function ArticleCard({
  article,
  size = "md",
}: {
  article: Article;
  size?: "sm" | "md";
}) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/article/${article.slug}`}
        className={`block overflow-hidden ${size === "sm" ? "aspect-[16/10]" : "aspect-video"}`}
      >
        <div className="w-full h-full transition-transform duration-300 group-hover:scale-105">
          <ArticleImage article={article} />
        </div>
      </Link>
      <div className="pt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="text-[11px] text-neutral-500">{timeAgo(article.publishedAt)}</span>
        </div>
        <Link href={`/article/${article.slug}`} className="headline-link">
          <h3
            className={`font-bold leading-snug text-ink ${
              size === "sm" ? "text-sm" : "text-lg"
            }`}
          >
            {article.title}
          </h3>
        </Link>
        {size === "md" && (
          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}
