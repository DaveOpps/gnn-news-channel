import Link from "next/link";
import { Article, categoryMeta } from "@/lib/types";
import { getSections } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import ArticleImage from "./ArticleImage";

// Re-exported for the server pages that already import it from here.
// Client components must import it from "@/lib/format" — this module reads
// the store, and dragging `fs` into a client bundle breaks the build.
export { timeAgo };

export function CategoryBadge({ category }: { category: string }) {
  const meta = categoryMeta(category, getSections());
  return (
    <Link
      href={`/category/${meta.slug}`}
      className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase text-white px-2 py-0.5"
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
            className={`headline leading-snug text-ink ${
              size === "sm" ? "text-[15px]" : "text-lg"
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
