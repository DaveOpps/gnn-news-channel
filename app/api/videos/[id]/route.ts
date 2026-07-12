import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getVideoById, updateVideo, deleteVideo } from "@/lib/store";
import { Video, youtubeId } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = getVideoById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const patch: Partial<Omit<Video, "id">> = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    patch.title = title;
  }
  if (body.show !== undefined) {
    const show = String(body.show).trim();
    if (!show) return NextResponse.json({ error: "Show is required" }, { status: 400 });
    patch.show = show;
  }
  if (body.youtubeId !== undefined) {
    const id2 = youtubeId(String(body.youtubeId));
    if (!id2) {
      return NextResponse.json(
        { error: "That doesn't look like a valid YouTube URL or video id" },
        { status: 400 }
      );
    }
    patch.youtubeId = id2;
  }
  if (body.duration !== undefined) patch.duration = String(body.duration).trim() || "0:00";
  if (body.featured !== undefined) patch.featured = Boolean(body.featured);

  const updated = updateVideo(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!deleteVideo(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
