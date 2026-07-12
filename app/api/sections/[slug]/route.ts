import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { updateSection, deleteSection, logActivity } from "@/lib/store";

type Params = { params: Promise<{ slug: string }> };

async function requireAdmin() {
  const me = await getCurrentEditor();
  if (!me) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (me.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Only an admin can change sections" },
        { status: 403 }
      ),
    };
  }
  return { me };
}

/** Rename or recolour. The slug is the public URL and never moves. */
export async function PUT(req: Request, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { slug } = await params;
  const body = await req.json().catch(() => ({}));

  const updated = await updateSection(slug, {
    label: body?.label !== undefined ? String(body.label) : undefined,
    color: body?.color !== undefined ? String(body.color) : undefined,
  });
  if (!updated) return NextResponse.json({ error: "No such section" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { slug } = await params;
  const result = await deleteSection(slug);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  await logActivity({
    action: "article.updated",
    editorId: guard.me.id,
    editorName: guard.me.name,
    target: `the "${slug}" section`,
    detail: "deleted",
  });
  return NextResponse.json({ ok: true });
}
