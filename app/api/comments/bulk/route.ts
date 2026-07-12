import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { bulkComments, logActivity } from "@/lib/store";
import { CommentBulkAction } from "@/lib/types";

const ACTIONS: CommentBulkAction[] = ["approve", "spam", "delete"];

export async function POST(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "") as CommentBulkAction;
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String) : [];

  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "No comments selected" }, { status: 400 });
  }

  const { updated } = await bulkComments(ids, action);

  await logActivity({
    action: action === "delete" ? "comment.deleted" : "comment.approved",
    editorId: me.id,
    editorName: me.name,
    target: `${updated} ${updated === 1 ? "comment" : "comments"}`,
    detail: `bulk ${action}`,
  });

  return NextResponse.json({ updated });
}
