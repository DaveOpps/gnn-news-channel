import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getModerationSettings, setModerationSettings } from "@/lib/store";

export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getModerationSettings());
}

/** Word filters shape what reaches the queue — admins only. */
export async function PUT(req: Request) {
  const me = await getCurrentEditor();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can change moderation filters" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const toList = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map(String)
      : String(v ?? "")
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean);

  return NextResponse.json(
    setModerationSettings({
      blockedTerms: toList(body.blockedTerms),
      blockedNames: toList(body.blockedNames),
    })
  );
}
