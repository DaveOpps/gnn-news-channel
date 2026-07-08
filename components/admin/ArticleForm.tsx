"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Article, CATEGORIES, formatByline } from "@/lib/types";
import StarRating from "@/components/StarRating";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-3xl text-neutral-dark">
            {isEdit ? "Edit Article" : "Create New Article"}
          </h1>
          <p className="text-neutral-gray text-sm mt-1">{isEdit ? "Update story details" : "Add a story to Ghana News Network"}</p>
        </div>
        <Link href="/admin/articles" className="text-sm font-bold text-neutral-500 hover:text-brand transition-colors">
          ← Back
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-brand text-red-700 text-sm px-5 py-4 rounded">
          <p className="font-bold">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg p-7 space-y-6">
        <div className="border-l-4 border-brand pl-4 pb-4">
          <p className="text-xs text-brand font-black uppercase tracking-widest">Story Content</p>
        </div>
        
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand mb-2">
            Headline *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Write a strong, clear headline…"
            className="w-full border-2 border-neutral-300 px-4 py-3 text-lg font-bold focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand mb-2">
            Excerpt / Standfirst
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="One or two sentences summarising the story…"
            className="w-full border-2 border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand mb-2">
            Story Body * <span className="normal-case font-normal text-neutral-500">(separate paragraphs with a blank line)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={14}
            placeholder="Write the full story here…"
            className="w-full border-2 border-neutral-300 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded transition-all font-mono"
          />
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-7 space-y-6">
        <div className="border-l-4 border-brand-secondary pl-4 pb-4">
          <p className="text-xs text-brand-secondary font-black uppercase tracking-widest">Metadata & Publishing</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand-secondary mb-2">
              Section
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-2 border-neutral-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/10 rounded transition-all font-semibold"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand-secondary mb-2">
              Lead Editor
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Reporter name"
              className="w-full border-2 border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/10 rounded transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand-secondary mb-2">
              Co-editors{" "}
              <span className="normal-case font-normal text-neutral-500">
                (additional writers, comma-separated)
              </span>
            </label>
            <input
              value={coAuthors}
              onChange={(e) => setCoAuthors(e.target.value)}
              placeholder="e.g. Abena Osei, Yaw Darko"
              className="w-full border-2 border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/10 rounded transition-all"
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              Byline preview:{" "}
              <span className="font-semibold text-neutral-600">
                {formatByline(
                  author || "Newsroom",
                  coAuthors.split(",").map((n) => n.trim()).filter(Boolean)
                )}
              </span>
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand-secondary mb-2">
            Story Image <span className="normal-case font-normal text-neutral-500">(upload or paste URL)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label
              className={`shrink-0 cursor-pointer bg-gradient-to-r from-brand to-brand-dark hover:shadow-lg text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 flex items-center gap-2 transition-all rounded ${uploading ? "opacity-60 pointer-events-none" : ""}`}
            >
              {uploading ? "Uploading…" : "📷 Upload"}
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
              className="flex-1 border-2 border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded transition-all"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="shrink-0 text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
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
              className="mt-4 h-48 w-auto object-cover border-2 border-neutral-200 rounded"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand-secondary mb-2">
            Tags <span className="normal-case font-normal text-neutral-500">(comma-separated)</span>
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="economy, election, ghana"
            className="w-full border-2 border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded transition-all"
          />
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-7 space-y-5">
        <div className="border-l-4 border-brand-accent pl-4 pb-2">
          <p className="text-xs text-brand-accent font-black uppercase tracking-widest">Publication Options</p>
        </div>

        <div className="flex flex-wrap items-start gap-10 pb-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand-secondary mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border-2 border-neutral-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/10 rounded transition-all font-semibold"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand-secondary mb-2">
              Editorial Quality Rating
            </label>
            <div className="flex items-center gap-3 h-[42px]">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className="text-xs font-bold text-neutral-500">
                {rating > 0 ? `${rating}/5` : "Unrated"}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 hover:bg-neutral-50 rounded transition-colors">
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
              className="w-5 h-5 accent-brand rounded"
            />
            <span className="text-sm font-bold text-neutral-dark">🚨 Breaking News (featured in live ticker)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none p-3 hover:bg-neutral-50 rounded transition-colors">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 accent-brand rounded"
            />
            <span className="text-sm font-bold text-neutral-dark">⭐ Featured Story (hero section candidate)</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-brand to-brand-dark hover:shadow-lg disabled:opacity-60 text-white font-black px-8 py-3 uppercase tracking-widest text-sm transition-all shadow-md rounded"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Article"}
        </button>
        <Link
          href="/admin/articles"
          className="text-sm font-bold text-neutral-500 hover:text-brand transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
