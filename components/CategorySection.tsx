import Link from "next/link";
import type { Article, Category } from "@/lib/types";
import ArticleCard from "./ArticleCard";

interface CategorySectionProps {
  category: { slug: Category; label: string; color: string };
  articles: Article[];
}

export default function CategorySection({
  category,
  articles,
}: CategorySectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-7 pb-3 border-b border-hairline-strong">
        <div className="flex items-center gap-3">
          <span
            className="w-1.5 h-6 shrink-0"
            style={{ backgroundColor: category.color }}
          ></span>
          <h2 className="font-semibold text-xl uppercase tracking-wide text-ink">
            {category.label}
          </h2>
        </div>
        <Link
          href={`/category/${category.slug}`}
          className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} size="sm" />
        ))}
      </div>
    </section>
  );
}
