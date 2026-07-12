import { NextResponse } from "next/server";
import path from "path";
import { getCurrentEditor } from "@/lib/auth";
import { put, recordMedia } from "@/lib/store";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  const me = await getCurrentEditor();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF or AVIF images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8 MB" }, { status: 400 });
  }

  const ext = (path.extname(file.name) || ".jpg").toLowerCase().slice(0, 6);
  const safeBase = path
    .basename(file.name, path.extname(file.name))
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 40);
  const filename = `${Date.now()}-${safeBase || "image"}${ext}`;

  const blob = await put(filename, file, { access: "public", addRandomSuffix: false });

  const item = {
    filename,
    url: blob.url,
    size: file.size,
    alt: typeof form?.get("alt") === "string" ? String(form.get("alt")) : undefined,
    uploadedBy: me.name,
    createdAt: new Date().toISOString(),
  };
  await recordMedia(item);

  return NextResponse.json(item, { status: 201 });
}
