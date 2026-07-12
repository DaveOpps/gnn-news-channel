import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getCuration, setCuration, clearCuration, logActivity } from "@/lib/store";

export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getCuration());
}

/** Save the manual front-page arrangement. Admins only — it's the shop window. */
export async function PUT(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can arrange the homepage" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const heroId = body.heroId ? String(body.heroId) : undefined;
  const topStoryIds = Array.isArray(body.topStoryIds)
    ? body.topStoryIds.map((id: unknown) => String(id)).filter(Boolean)
    : [];

  const curation = await setCuration(heroId, topStoryIds, me.name);
  await logActivity({
    action: "homepage.curated",
    editorId: me.id,
    editorName: me.name,
    target: "the homepage",
    detail: `${topStoryIds.length} top stories`,
  });
  return NextResponse.json(curation);
}

/** Fall back to automatic ordering. */
export async function DELETE() {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can arrange the homepage" },
      { status: 403 }
    );
  }

  await clearCuration();
  await logActivity({
    action: "homepage.reset",
    editorId: me.id,
    editorName: me.name,
    target: "the homepage to automatic ordering",
  });
  return NextResponse.json({ ok: true });
}
