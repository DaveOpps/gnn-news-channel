import { NextResponse } from "next/server";
import { verifyCredentials, sessionValue, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  const editor = verifyCredentials(String(username ?? "").trim(), String(password ?? ""));
  if (!editor) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const res = NextResponse.json({
    ok: true,
    editor: { name: editor.name, role: editor.role },
  });
  res.cookies.set(SESSION_COOKIE, sessionValue(editor.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
