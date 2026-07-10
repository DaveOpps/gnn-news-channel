import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { addEditorReply, getCommentById, getById, logActivity } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

/** Reply to a reader as the newsroom. Published immediately. */
export async function POST(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parent = getCommentById(id);
  if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parent.parentId) {
    return NextResponse.json(
      { error: "Replies are one level deep" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "A reply needs some text" }, { status: 400 });
  }

  const reply = addEditorReply(id, text, me);
  if (!reply) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const article = getById(parent.articleId);
  logActivity({
    action: "comment.approved",
    editorId: me.id,
    editorName: me.name,
    target: article?.title ?? "a story",
    targetId: parent.articleId,
    detail: `replied to ${parent.name}`,
  });

  return NextResponse.json(reply, { status: 201 });
}
