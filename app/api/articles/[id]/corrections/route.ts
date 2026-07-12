import { NextResponse } from "next/server";
import { getCurrentEditor, canEditArticle } from "@/lib/auth";
import { getById, addCorrection, deleteCorrection, recordArticleAction } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

/** Append a correction. Published immediately, in the open. */
export async function POST(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const article = await getById(id);
  if (!article || article.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditArticle(me, article)) {
    return NextResponse.json(
      { error: "This story belongs to another editor" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const note = String(body?.note ?? "").trim();
  if (!note) {
    return NextResponse.json({ error: "A correction needs a note" }, { status: 400 });
  }

  const updated = await addCorrection(id, note, me.name);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recordArticleAction("article.updated", me, updated, "published a correction");
  return NextResponse.json(updated, { status: 201 });
}

/** Remove a correction that was filed in error (?correctionId=). Admins only. */
export async function DELETE(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can remove a published correction" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const correctionId = new URL(req.url).searchParams.get("correctionId") ?? "";
  const updated = await deleteCorrection(id, correctionId);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
