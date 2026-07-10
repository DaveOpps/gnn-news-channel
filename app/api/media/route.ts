import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/auth";
import { getMediaWithUsage } from "@/lib/store";

export async function GET() {
  if (!(await getCurrentEditor())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getMediaWithUsage());
}
