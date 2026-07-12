import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getPublicEditors, createEditor } from "@/lib/store";
import { toPublicEditor } from "@/lib/types";

/** Any signed-in editor can see the roster (needed for bylines + analytics). */
export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getPublicEditors());
}

/** Only admins create accounts. */
export async function POST(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only an admin can add editors" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const result = await createEditor({
    name: String(body.name ?? ""),
    username: String(body.username ?? ""),
    password: String(body.password ?? ""),
    photoUrl: body.photoUrl ? String(body.photoUrl) : undefined,
    title: body.title ? String(body.title) : undefined,
    bio: body.bio ? String(body.bio) : undefined,
    role: body.role === "admin" ? "admin" : "editor",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json(toPublicEditor(result.editor), { status: 201 });
}
