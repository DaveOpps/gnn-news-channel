"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Article, CATEGORIES } from "@/lib/types";

export default function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const isEdit = Boolean(article);

  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [category, setCategory] = useState<string>(article?.category ?? "world");
  const [author, setAuthor] = useState(article?.author ?? "");
  const [imageUrl, setImageUrl] = useState(article?.imageUrl ?? "");
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<string>(article?.status ?? "published");
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking ?? false);
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured ?? false);

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
        imageUrl,
        tags,
        status,
        isBreaking,
        isFeatured,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-black text-2xl">
          {isEdit ? "Edit Article" : "New Article"}
        </h1>
        <Link href="/admin/articles" className="text-sm font-semibold text-neutral-500 hover:text-ink">
          ← Back to articles
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Headline *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Write a strong, clear headline…"
            className="w-full border border-neutral-300 px-4 py-3 text-lg font-bold focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Excerpt / Standfirst
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="One or two sentences summarising the story…"
            className="w-full border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Story Body * <span className="normal-case font-normal">(separate paragraphs with a blank line)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={14}
            placeholder="Write the full story here…"
            className="w-full border border-neutral-300 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-brand font-mono"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Section
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Author
          </label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Reporter name"
            className="w-full border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Story Image <span className="normal-case font-normal">(upload a file or paste a URL — a styled placeholder is used if empty)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label
              className={`shrink-0 cursor-pointer bg-ink hover:bg-black text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 flex items-center gap-2 transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}
            >
              {uploading ? "Uploading…" : "📷 Upload Image"}
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
              className="flex-1 border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Story image preview"
              className="mt-3 h-40 w-auto object-cover border border-neutral-200"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Tags <span className="normal-case font-normal">(comma-separated)</span>
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="economy, election, ghana"
            className="w-full border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm p-6 flex flex-wrap items-center gap-8">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none pt-5">
          <input
            type="checkbox"
            checked={isBreaking}
            onChange={(e) => setIsBreaking(e.target.checked)}
            className="w-4 h-4 accent-[#cc0000]"
          />
          <span className="text-sm font-semibold">🚨 Breaking news (shows in ticker)</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none pt-5">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 accent-[#cc0000]"
          />
          <span className="text-sm font-semibold">⭐ Featured (hero candidate)</span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold px-8 py-3 uppercase tracking-widest text-sm transition-colors"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Publish Article"}
        </button>
        <Link
          href="/admin/articles"
          className="text-sm font-semibold text-neutral-500 hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
