import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { addComment, getAllComments, getById } from "@/lib/store";

// Admin: list all comments for moderation
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getAllComments());
}

// Public: submit a comment (goes into the moderation queue)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const articleId = String(body?.articleId ?? "");
  const name = String(body?.name ?? "").trim();
  const text = String(body?.text ?? "").trim();

  if (!articleId || !getById(articleId)) {
    return NextResponse.json({ error: "Unknown article" }, { status: 400 });
  }
  if (!name || !text) {
    return NextResponse.json(
      { error: "Name and comment are required" },
      { status: 400 }
    );
  }
  const comment = addComment(articleId, name, text);
  return NextResponse.json(comment, { status: 201 });
}
