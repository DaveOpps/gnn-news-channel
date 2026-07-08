import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { addSubscriber, getSubscribers, removeSubscriber } from "@/lib/store";

// Public: subscribe to the newsletter
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = addSubscriber(String(body?.email ?? ""));
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Admin: list subscribers
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getSubscribers());
}

// Admin: remove a subscriber (?email=)
export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = new URL(req.url).searchParams.get("email") ?? "";
  if (!removeSubscriber(email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
