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
  const stories = Object.entries(perArticle)
    .map(([id, readers]) => ({ id, readers, title: getById(id)?.title ?? "Unknown" }))
    .sort((a, b) => b.readers - a.readers)
    .slice(0, 5);

  return NextResponse.json({ readers: activeReaders(), stories });
}
