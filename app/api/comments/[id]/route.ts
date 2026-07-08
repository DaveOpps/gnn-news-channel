import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { setCommentStatus, deleteComment } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status === "approved" ? "approved" : "pending";
  const updated = setCommentStatus(id, status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!deleteComment(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
