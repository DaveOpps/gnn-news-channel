import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { resetAllViews, logActivity } from "@/lib/store";

/**
 * Reset every story's view count to zero and clear the traffic history.
 * Admin-only — this wipes analytics for the whole newsroom.
 */
export async function POST() {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const count = await resetAllViews();

  await logActivity({
    action: "article.updated",
    editorId: me.id,
    editorName: me.name,
    target: "all stories",
    detail: `reset view counts (${count} stories)`,
  });

  return NextResponse.json({ ok: true, reset: count });
}
