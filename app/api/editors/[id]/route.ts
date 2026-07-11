import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { updateEditor, deleteEditor, getEditorById } from "@/lib/store";
import { verifyPassword } from "@/lib/password";
import { toPublicEditor } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

/** Admins may edit anyone; an editor may update their own profile (never their role). */
export async function PUT(req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!getEditorById(id)) {
    return NextResponse.json({ error: "Editor not found" }, { status: 404 });
  }

  const isSelf = me.id === id;
  const isAdmin = me.role === "admin";
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "You can only edit your own profile" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Changing *your own* password requires proving you know the current one —
  // otherwise a borrowed session is enough to lock the real owner out.
  // An admin resetting someone else's password does not need it.
  if (body.password && isSelf) {
    const stored = getEditorById(id)!;
    if (!verifyPassword(String(body.currentPassword ?? ""), stored.passwordHash)) {
      return NextResponse.json(
        { error: "Your current password is incorrect" },
        { status: 403 }
      );
    }
  }

  const result = updateEditor(id, {
    name: body.name !== undefined ? String(body.name) : undefined,
    username: body.username !== undefined ? String(body.username) : undefined,
    password: body.password ? String(body.password) : undefined,
    photoUrl: body.photoUrl !== undefined ? String(body.photoUrl) : undefined,
    title: body.title !== undefined ? String(body.title) : undefined,
    bio: body.bio !== undefined ? String(body.bio) : undefined,
    // Role changes are an admin-only privilege.
    role: isAdmin && body.role !== undefined
      ? body.role === "admin" ? "admin" : "editor"
      : undefined,
  });

  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json(toPublicEditor(result.editor));
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only an admin can remove editors" }, { status: 403 });
  }

  const { id } = await params;
  if (me.id === id) {
    return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
  }

  const result = deleteEditor(id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true });
}
