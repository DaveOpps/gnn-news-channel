import { Article } from "@/lib/types";
import { categoryMeta } from "@/lib/types";

export default function ArticleImage({
  article,
  className = "",
}: {
  article: Article;
  className?: string;
}) {
  const meta = categoryMeta(article.category);

  if (article.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={article.imageUrl}
        alt={article.title}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-end relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${meta.color} 0%, #16161a 85%)`,
      }}
    >
      <span
        className="absolute -right-4 -top-8 font-black select-none"
        style={{ fontSize: "9rem", color: "rgba(255,255,255,0.08)", lineHeight: 1 }}
      >
        {meta.label.slice(0, 2).toUpperCase()}
      </span>
      <span className="relative z-10 text-white/90 text-[11px] font-bold tracking-[0.2em] uppercase p-3">
        {meta.label}
      </span>
    </div>
  );
}
