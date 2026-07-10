import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import {
  getSections,
  createSection,
  reorderSections,
  countArticlesBySection,
  logActivity,
} from "@/lib/store";

export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    sections: getSections(),
    counts: countArticlesBySection(),
  });
}

/** Create a section. The slug is derived from the name and then frozen. */
export async function POST(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can change sections" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const result = createSection(String(body?.label ?? ""), String(body?.color ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  logActivity({
    action: "article.updated",
    editorId: me.id,
    editorName: me.name,
    target: `the "${result.section.label}" section`,
    detail: "created",
  });
  return NextResponse.json(result.section, { status: 201 });
}

/** Reorder the whole list in one write. */
export async function PUT(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can change sections" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs.map(String) : [];
  if (slugs.length === 0) {
    return NextResponse.json({ error: "No order supplied" }, { status: 400 });
  }
  return NextResponse.json(reorderSections(slugs));
}
