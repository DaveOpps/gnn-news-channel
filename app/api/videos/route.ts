import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getVideos, createVideo } from "@/lib/store";
import { youtubeId } from "@/lib/types";

export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getVideos());
}

export async function POST(req: Request) {
  const me = await getCurrentEditor();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim() || !body?.show?.trim()) {
    return NextResponse.json({ error: "Title and show are required" }, { status: 400 });
  }

  const id = youtubeId(String(body.youtubeId ?? ""));
  if (!id) {
    return NextResponse.json(
      { error: "That doesn't look like a valid YouTube URL or video id" },
      { status: 400 }
    );
  }

  const video = await createVideo({
    title: String(body.title).trim(),
    show: String(body.show).trim(),
    youtubeId: id,
    duration: String(body.duration ?? "").trim() || "0:00",
    featured: Boolean(body.featured),
  });

  return NextResponse.json(video, { status: 201 });
}
