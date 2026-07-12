import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getAll, getAllComments, getPublicEditors } from "@/lib/store";

/** Newsroom-wide search, powering the command palette. */
export async function GET(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json({ articles: [], comments: [], editors: [] });

  const articles = (await getAll())
    .filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.slug.includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    )
    .slice(0, 6)
    .map((a) => ({ id: a.id, title: a.title, status: a.status }));

  const comments = (await getAllComments())
    .filter((c) => c.text.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      name: c.name,
      text: c.text.slice(0, 90),
      articleId: c.articleId,
    }));

  // Editor accounts are only browsable by an admin.
  const editors =
    me.role === "admin"
      ? (await getPublicEditors())
          .filter((e) => e.name.toLowerCase().includes(q) || e.username.includes(q))
          .slice(0, 4)
          .map((e) => ({ id: e.id, name: e.name, username: e.username }))
      : [];

  return NextResponse.json({ articles, comments, editors });
}
