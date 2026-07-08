export type Category =
  | "world"
  | "politics"
  | "business"
  | "technology"
  | "sports"
  | "health"
  | "entertainment";

export const CATEGORIES: { slug: Category; label: string; color: string }[] = [
  { slug: "world", label: "World", color: "#b91c1c" },
  { slug: "politics", label: "Politics", color: "#1d4ed8" },
  { slug: "business", label: "Business", color: "#047857" },
  { slug: "technology", label: "Technology", color: "#6d28d9" },
  { slug: "sports", label: "Sports", color: "#c2410c" },
  { slug: "health", label: "Health", color: "#0e7490" },
  { slug: "entertainment", label: "Entertainment", color: "#be185d" },
];

export function categoryMeta(slug: string) {
  return (
    CATEGORIES.find((c) => c.slug === slug) ?? {
      slug: "world" as Category,
      label: "News",
      color: "#b91c1c",
    }
  );
}

export interface Comment {
  id: string;
  articleId: string;
  name: string;
  text: string;
  status: "pending" | "approved";
  createdAt: string; // ISO
}

export interface Subscriber {
  email: string;
  createdAt: string; // ISO
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // paragraphs separated by blank lines
  category: Category;
  author: string;
  imageUrl?: string;
  tags: string[];
  status: "published" | "draft";
  isBreaking: boolean;
  isFeatured: boolean;
  views: number;
  publishedAt: string; // ISO
  updatedAt: string; // ISO
}
