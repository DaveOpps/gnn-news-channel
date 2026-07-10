import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { CommentStatus } from "@/lib/types";
import {
  setCommentStatus,
  deleteComment,
  getCommentById,
  getById,
  logActivity,
} from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const raw = String(body?.status ?? "");
  const status: CommentStatus =
    raw === "approved" ? "approved" : raw === "spam" ? "spam" : "pending";
  const updated = setCommentStatus(id, status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "approved") {
    const article = getById(updated.articleId);
    logActivity({
      action: "comment.approved",
      editorId: me.id,
      editorName: me.name,
      target: article?.title ?? "a story",
      targetId: updated.articleId,
      detail: `from ${updated.name}`,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = getCommentById(id);
  if (!deleteComment(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing) {
    const article = getById(existing.articleId);
    logActivity({
      action: "comment.deleted",
      editorId: me.id,
      editorName: me.name,
      target: article?.title ?? "a story",
      targetId: existing.articleId,
      detail: `from ${existing.name}`,
    });
  }

  return NextResponse.json({ ok: true });
}
