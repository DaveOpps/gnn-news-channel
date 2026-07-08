import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getById, updateArticle, deleteArticle } from "@/lib/store";
import { Article, CATEGORIES } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const article = getById(id);
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PUT(req: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const patch: Partial<Omit<Article, "id">> = {};
  if (body.title !== undefined) patch.title = String(body.title).trim();
  if (body.slug !== undefined) patch.slug = String(body.slug);
  if (body.excerpt !== undefined) patch.excerpt = String(body.excerpt).trim();
  if (body.body !== undefined) patch.body = String(body.body).trim();
  if (body.author !== undefined) patch.author = String(body.author).trim() || "Newsroom";
  if (body.imageUrl !== undefined)
    patch.imageUrl = String(body.imageUrl).trim() || undefined;
  if (body.category !== undefined && CATEGORIES.some((c) => c.slug === body.category))
    patch.category = body.category;
  if (body.status !== undefined)
    patch.status = body.status === "draft" ? "draft" : "published";
  if (body.isBreaking !== undefined) patch.isBreaking = Boolean(body.isBreaking);
  if (body.isFeatured !== undefined) patch.isFeatured = Boolean(body.isFeatured);
  if (body.rating !== undefined)
    patch.rating = Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0)));
  if (body.tags !== undefined)
    patch.tags = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : String(body.tags)
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);

  const updated = updateArticle(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!deleteArticle(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
