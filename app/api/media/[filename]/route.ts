import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { deleteMediaFile, getMediaItems, getMediaUsage, setMediaAlt } from "@/lib/store";

type Params = { params: Promise<{ filename: string }> };

/** Update alt text — accessibility metadata, any editor may set it. */
export async function PUT(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename } = await params;
  const body = await req.json().catch(() => ({}));
  await setMediaAlt(decodeURIComponent(filename), String(body?.alt ?? ""));
  return NextResponse.json({ ok: true });
}

/**
 * Delete an upload. Refused while a story still points at it — an image that
 * vanishes from a published article is worse than an orphaned file.
 */
export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can delete media" },
      { status: 403 }
    );
  }

  const filename = decodeURIComponent((await params).filename);
  const item = (await getMediaItems()).find((m) => m.filename === filename);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const usage = await getMediaUsage(item.url);
  if (usage.length > 0) {
    return NextResponse.json(
      {
        error: `Still used by ${usage.length} ${usage.length === 1 ? "story" : "stories"}: ${usage
          .map((u) => u.title)
          .slice(0, 3)
          .join(", ")}`,
      },
      { status: 409 }
    );
  }

  if (!(await deleteMediaFile(filename))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
