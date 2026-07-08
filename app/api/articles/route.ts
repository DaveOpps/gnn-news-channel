import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAll, createArticle } from "@/lib/store";
import { CATEGORIES, Category } from "@/lib/types";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getAll());
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim() || !body?.body?.trim()) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }
  const category: Category = CATEGORIES.some((c) => c.slug === body.category)
    ? body.category
    : "world";

  const article = createArticle({
    title: String(body.title).trim(),
    slug: body.slug ? String(body.slug) : undefined,
    excerpt: String(body.excerpt ?? "").trim(),
    body: String(body.body).trim(),
    category,
    author: String(body.author ?? "Newsroom").trim() || "Newsroom",
    imageUrl: body.imageUrl ? String(body.imageUrl).trim() : undefined,
    tags: Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : String(body.tags ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    status: body.status === "draft" ? "draft" : "published",
    isBreaking: Boolean(body.isBreaking),
    isFeatured: Boolean(body.isFeatured),
  });
  return NextResponse.json(article, { status: 201 });
}
