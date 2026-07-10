"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Article, CATEGORIES, formatByline } from "@/lib/types";
import StarRating from "@/components/StarRating";
import { Card, Icon, btnPrimary, btnSecondary, input, microLabel } from "./ui";

/** ISO → the "YYYY-MM-DDTHH:mm" shape a datetime-local input expects, in local time. */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Default a new schedule to one hour from now. */
function defaultSchedule(): string {
  return toLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString());
}

export default function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const isEdit = Boolean(article);

  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [category, setCategory] = useState<string>(article?.category ?? "world");
  const [author, setAuthor] = useState(article?.author ?? "");
  const [coAuthors, setCoAuthors] = useState(article?.coAuthors?.join(", ") ?? "");
  const [imageUrl, setImageUrl] = useState(article?.imageUrl ?? "");
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<string>(article?.status ?? "published");
  const [scheduledFor, setScheduledFor] = useState(toLocalInput(article?.scheduledFor));
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking ?? false);
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured ?? false);
  const [rating, setRating] = useState<number>(article?.rating ?? 0);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Image upload failed");
        return;
      }
      setImageUrl(data.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title,
        excerpt,
        body,
        category,
        author,
        coAuthors,
        imageUrl,
        tags,
        status,
        scheduledFor:
          status === "scheduled" && scheduledFor
            ? new Date(scheduledFor).toISOString()
            : undefined,
        isBreaking,
        isFeatured,
        rating,
      };
      const res = await fetch(
        isEdit ? `/api/articles/${article!.id}` : "/api/articles",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save article");
        return;
      }
      router.push("/admin/articles");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const sectionTitle = "text-sm font-semibold text-zinc-900";
  const label = `mb-1.5 block ${microLabel}`;
  const hint = "text-xs font-normal normal-case tracking-normal text-zinc-400";

  const coAuthorList = coAuthors
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {isEdit ? "Edit article" : "New article"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isEdit
              ? "Update this story's content and publication settings."
              : "Write a story and publish it to Ghana News Network."}
          </p>
        </div>
        <Link
          href="/admin/articles"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back to articles
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Content */}
      <Card className="space-y-5 p-6">
        <h2 className={sectionTitle}>Content</h2>

        <div>
          <label className={label}>Headline</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Write a strong, clear headline…"
            className={`${input} text-base font-medium`}
          />
        </div>

        <div>
          <label className={label}>
            Excerpt <span className={hint}>— the standfirst shown under the headline</span>
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="One or two sentences summarising the story…"
            className={input}
          />
        </div>

        <div>
          <label className={label}>
            Story body <span className={hint}>— separate paragraphs with a blank line</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={14}
            placeholder="Write the full story here…"
            className={`${input} font-mono text-[13px] leading-relaxed`}
          />
        </div>
      </Card>

      {/* Attribution */}
      <Card className="space-y-5 p-6">
        <h2 className={sectionTitle}>Attribution</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={label}>Section</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={input}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Lead editor</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Reporter name"
              className={input}
            />
          </div>
        </div>

        <div>
          <label className={label}>
            Co-editors <span className={hint}>— additional writers, comma-separated</span>
          </label>
          <input
            value={coAuthors}
            onChange={(e) => setCoAuthors(e.target.value)}
            placeholder="e.g. Abena Osei, Yaw Darko"
            className={input}
          />
          <p className="mt-2 text-xs text-zinc-400">
            Byline preview:{" "}
            <span className="font-medium text-zinc-600">
              {formatByline(author || "Newsroom", coAuthorList)}
            </span>
          </p>
        </div>

        <div>
          <label className={label}>
            Tags <span className={hint}>— comma-separated</span>
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="economy, election, ghana"
            className={input}
          />
        </div>
      </Card>

      {/* Media */}
      <Card className="space-y-4 p-6">
        <h2 className={sectionTitle}>Media</h2>
        <p className="-mt-2 text-xs text-zinc-400">
          Optional. A styled placeholder is used when no image is set.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label
            className={`${btnSecondary} shrink-0 cursor-pointer ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Icon.Image className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… or /uploads/…"
            className={input}
          />
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Remove image"
            >
              <Icon.Trash className="h-4 w-4" />
            </button>
          )}
        </div>

        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Story image preview"
            className="h-44 w-auto rounded-lg border border-zinc-200 object-cover"
          />
        )}
      </Card>

      {/* Publishing */}
      <Card className="space-y-5 p-6">
        <h2 className={sectionTitle}>Publishing</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={label}>Status</label>
            <select
              value={status}
              onChange={(e) => {
                const next = e.target.value;
                setStatus(next);
                if (next === "scheduled" && !scheduledFor) {
                  setScheduledFor(defaultSchedule());
                }
              }}
              className={input}
            >
              <option value="published">Published — live now</option>
              <option value="scheduled">Scheduled — publish later</option>
              <option value="draft">Draft — not visible</option>
            </select>
          </div>

          <div>
            <label className={label}>Editorial quality rating</label>
            <div className="flex h-[42px] items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className="text-xs tabular-nums text-zinc-500">
                {rating > 0 ? `${rating}/5` : "Unrated"}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-xs text-zinc-400 transition-colors hover:text-red-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {status === "scheduled" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
            <label className={`${label} text-blue-900`}>Publish at</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={toLocalInput(new Date().toISOString())}
              required
              className={`${input} max-w-xs`}
            />
            <p className="mt-2 text-xs text-blue-800">
              The story stays hidden until this time, then goes live automatically —
              no further action needed.
            </p>
          </div>
        )}

        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          <label className="flex cursor-pointer select-none items-start gap-3 p-4 transition-colors hover:bg-zinc-50/70">
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-[var(--brand)]"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">Breaking news</span>
              <span className="block text-xs text-zinc-500">
                Shows in the live ticker across the site.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer select-none items-start gap-3 p-4 transition-colors hover:bg-zinc-50/70">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-[var(--brand)]"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">Featured story</span>
              <span className="block text-xs text-zinc-500">
                Candidate for the homepage hero and Editor&apos;s Picks.
              </span>
            </span>
          </label>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-4">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : status === "scheduled"
                ? "Schedule article"
                : status === "draft"
                  ? "Save draft"
                  : "Publish article"}
        </button>
        <Link href="/admin/articles" className={btnSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
