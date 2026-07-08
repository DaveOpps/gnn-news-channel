"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Article, CATEGORIES, categoryMeta } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function ArticlesManager({ initial }: { initial: Article[] }) {
  const [articles, setArticles] = useState<Article[]>(initial);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (status !== "all" && a.status !== status) return false;
      if (query && !a.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [articles, query, category, status]);

  async function patch(id: string, body: Partial<Article>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated: Article = await res.json();
        setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) setArticles((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-3xl text-neutral-dark">Articles</h1>
          <p className="text-neutral-gray text-sm mt-1">{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-gradient-to-r from-brand to-brand-dark hover:shadow-lg text-white font-black text-sm px-6 py-3 uppercase tracking-widest transition-all shadow-md"
        >
          + Create Article
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-lg p-5 flex flex-wrap gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search article titles…"
          className="flex-1 min-w-48 border-2 border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded transition-all font-medium"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border-2 border-neutral-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded font-semibold"
        >
          <option value="all">All sections</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border-2 border-neutral-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 rounded font-semibold"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand to-brand-dark border-b-2 border-brand-accent text-left text-[10px] uppercase tracking-[0.1em] font-black text-white">
              <th className="px-6 py-4">Title</th>
              <th className="px-4 py-4">Section</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-center">Breaking</th>
              <th className="px-4 py-4 text-center">Featured</th>
              <th className="px-4 py-4 text-center">Rating</th>
              <th className="px-4 py-4 text-right">Views</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((a) => {
              const meta = categoryMeta(a.category);
              const isBusy = busy === a.id;
              return (
                <tr key={a.id} className={`hover:bg-neutral-50 transition-colors ${isBusy ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4 max-w-md">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="font-bold text-neutral-dark hover:text-brand transition-colors line-clamp-1"
                    >
                      {a.title}
                    </Link>
                    <span className="text-xs text-neutral-400 font-medium">by {a.author}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-[9px] font-black uppercase tracking-wider text-white px-2.5 py-1 rounded"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        patch(a.id, {
                          status: a.status === "published" ? "draft" : "published",
                        })
                      }
                      className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                        a.status === "published"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                      title="Click to toggle"
                    >
                      {a.status}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      disabled={isBusy}
                      onClick={() => patch(a.id, { isBreaking: !a.isBreaking })}
                      className={`text-xl leading-none transition-opacity cursor-pointer ${a.isBreaking ? "opacity-100" : "grayscale opacity-30 hover:opacity-60"}`}
                      title="Toggle breaking"
                    >
                      🚨
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      disabled={isBusy}
                      onClick={() => patch(a.id, { isFeatured: !a.isFeatured })}
                      className={`text-xl leading-none transition-opacity cursor-pointer ${a.isFeatured ? "opacity-100" : "grayscale opacity-30 hover:opacity-60"}`}
                      title="Toggle featured"
                    >
                      ⭐
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StarRating
                      value={a.rating ?? 0}
                      onChange={(v) => patch(a.id, { rating: v })}
                      size="sm"
                      disabled={isBusy}
                    />
                  </td>
                  <td className="px-4 py-4 text-right text-neutral-600 font-semibold">
                    {a.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                    <Link
                      href={`/article/${a.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-neutral-500 hover:text-brand transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="text-xs font-bold text-brand-secondary hover:text-brand transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      disabled={isBusy}
                      onClick={() => remove(a.id, a.title)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-neutral-400 font-medium">
                  No articles match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
