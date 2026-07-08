import Link from "next/link";
import type { Article, Category } from "@/lib/types";
import ArticleCard from "./ArticleCard";

interface CategorySectionProps {
  category: Category;
  articles: Article[];
}

export default function CategorySection({
  category,
  articles,
}: CategorySectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8 border-b-4 pb-3" style={{ borderColor: category.color }}>
        <div className="flex items-center gap-4">
          <div
            className="w-2 h-10 rounded-full"
            style={{ backgroundColor: category.color }}
          ></div>
          <h2 className="font-black text-2xl uppercase tracking-wide text-neutral-dark">
            {category.label}
          </h2>
        </div>
        <Link
          href={`/category/${category.slug}`}
          className="text-sm font-bold text-brand hover:text-brand-dark transition-colors hover:underline underline-offset-2"
        >
          View All →
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
