import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getAll, createArticle, getEditorById } from "@/lib/store";
import { CATEGORIES, Category } from "@/lib/types";

export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getAll());
}

export async function POST(req: Request) {
  const me = await getCurrentEditor();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim() || !body?.body?.trim()) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }
  const category: Category = CATEGORIES.some((c) => c.slug === body.category)
    ? body.category
    : "world";

  // A story belongs to whoever wrote it. Admins may file on another editor's
  // behalf by passing authorId; everyone else is credited to themselves.
  let author = me;
  if (body.authorId && me.role === "admin") {
    author = getEditorById(String(body.authorId)) ?? me;
  }

  const article = createArticle({
    title: String(body.title).trim(),
    slug: body.slug ? String(body.slug) : undefined,
    excerpt: String(body.excerpt ?? "").trim(),
    body: String(body.body).trim(),
    category,
    author: author.name,
    authorId: author.id,
    coAuthors: Array.isArray(body.coAuthors)
      ? body.coAuthors.map((n: unknown) => String(n).trim()).filter(Boolean)
      : String(body.coAuthors ?? "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
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
    rating: Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0))),
  });
  return NextResponse.json(article, { status: 201 });
}
