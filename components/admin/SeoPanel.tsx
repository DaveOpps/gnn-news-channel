"use client";

import { Card, microLabel, input } from "./ui";

const SITE = "gnn.com";

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

type Check = { label: string; ok: boolean; detail: string };

export default function SeoPanel({
  title,
  slug,
  onSlugChange,
  metaDescription,
  onMetaChange,
  excerpt,
  imageUrl,
  tags,
}: {
  title: string;
  slug: string;
  onSlugChange: (v: string) => void;
  metaDescription: string;
  onMetaChange: (v: string) => void;
  excerpt: string;
  imageUrl?: string;
  tags: string;
}) {
  // What actually ships to Google if the field is left empty.
  const effectiveDesc = metaDescription.trim() || excerpt.trim();
  const previewSlug = slug.trim() || slugify(title) || "story";
  const tagCount = tags.split(",").map((t) => t.trim()).filter(Boolean).length;

  const checks: Check[] = [
    {
      label: "Headline length",
      ok: title.length >= 30 && title.length <= 65,
      detail: `${title.length} chars — aim for 30–65`,
    },
    {
      label: "Description length",
      ok: effectiveDesc.length >= 70 && effectiveDesc.length <= 160,
      detail: `${effectiveDesc.length} chars — aim for 70–160`,
    },
    { label: "Social image", ok: Boolean(imageUrl), detail: imageUrl ? "Set" : "None — cards look bare" },
    { label: "Tags", ok: tagCount > 0, detail: tagCount ? `${tagCount} tags` : "None" },
  ];
  const score = checks.filter((c) => c.ok).length;

  const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Search &amp; social</h2>
        <span
          className={`text-xs font-medium tabular-nums ${
            score === checks.length ? "text-emerald-600" : "text-zinc-400"
          }`}
        >
          {score}/{checks.length} checks
        </span>
      </div>

      <div>
        <label className={`mb-1.5 block ${microLabel}`}>
          URL slug{" "}
          <span className="font-normal normal-case tracking-normal text-zinc-400">
            — leave blank to derive from the headline
          </span>
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 focus-within:border-zinc-400">
          <span className="shrink-0 text-sm text-zinc-400">/article/</span>
          <input
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            onBlur={(e) => onSlugChange(slugify(e.target.value))}
            placeholder={slugify(title) || "story-slug"}
            className="min-w-0 flex-1 border-0 p-0 text-sm text-zinc-900 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      <div>
        <label className={`mb-1.5 block ${microLabel}`}>
          Meta description{" "}
          <span className="font-normal normal-case tracking-normal text-zinc-400">
            — falls back to the excerpt
          </span>
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => onMetaChange(e.target.value)}
          rows={2}
          placeholder={excerpt || "What a searcher should see…"}
          className={input}
        />
        <p className="mt-1 text-xs tabular-nums text-zinc-400">
          {effectiveDesc.length}/160
        </p>
      </div>

      {/* Google result preview */}
      <div>
        <p className={`mb-2 ${microLabel}`}>Google result</p>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-600">
            {SITE} › article › {truncate(previewSlug, 28)}
          </p>
          <p className="mt-0.5 text-lg leading-snug text-[#1a0dab]">
            {truncate(title || "Your headline appears here", 60)}
          </p>
          <p className="mt-1 text-sm leading-snug text-zinc-600">
            {truncate(effectiveDesc || "Your description appears here.", 160)}
          </p>
        </div>
      </div>

      {/* Social card preview */}
      <div>
        <p className={`mb-2 ${microLabel}`}>Social card</p>
        <div className="max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="aspect-[1.91/1] bg-zinc-100">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                No image set
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-400">{SITE}</p>
            <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-zinc-900">
              {title || "Your headline"}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{effectiveDesc}</p>
          </div>
        </div>
      </div>

      <ul className="space-y-1.5 border-t border-zinc-100 pt-4">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                c.ok ? "bg-emerald-500" : "bg-zinc-300"
              }`}
              aria-hidden
            >
              {c.ok ? "✓" : "!"}
            </span>
            <span className="text-zinc-700">{c.label}</span>
            <span className="ml-auto text-xs text-zinc-400">{c.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
