import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { activeReaders, readersByArticle } from "@/lib/presence";
import { getById } from "@/lib/store";

/** Newsroom-only: who is reading, right now. */
export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perArticle = readersByArticle();
  const stories = await Promise.all(
    Object.entries(perArticle).map(async ([id, readers]) => ({
      id,
      readers,
      title: (await getById(id))?.title ?? "Unknown",
    }))
  );
  stories.sort((a, b) => b.readers - a.readers);
  const top = stories.slice(0, 5);

  return NextResponse.json({ readers: activeReaders(), stories: top });
}
