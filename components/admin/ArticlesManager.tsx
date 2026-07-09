"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Article, CATEGORIES, categoryMeta } from "@/lib/types";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-2xl text-neutral-900">Articles</h1>
          <p className="text-sm text-neutral-500">{filtered.length} matching result{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="admin-button admin-button-primary"
        >
          + New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="admin-card p-5 flex flex-col md:flex-row flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title…"
          className="flex-1 min-w-48 border border-neutral-300 px-4 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 transition-all"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-neutral-300 px-3.5 py-2 text-sm bg-white rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 transition-all"
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
          className="border border-neutral-300 px-3.5 py-2 text-sm bg-white rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 transition-all"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <table className="admin-table w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-5 py-3">Title</th>
              <th className="px-3 py-3">Section</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-center">Breaking</th>
              <th className="px-3 py-3 text-center">Featured</th>
              <th className="px-3 py-3 text-right">Views</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const meta = categoryMeta(a.category);
              const isBusy = busy === a.id;
              return (
                <tr key={a.id} className={`hover:bg-neutral-50 transition-colors ${isBusy ? "opacity-50 pointer-events-none" : ""}`}>
                  <td className="px-5 py-3.5 max-w-md">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="font-semibold text-neutral-900 hover:text-brand line-clamp-1 transition-colors"
                    >
                      {a.title}
                    </Link>
                    <span className="text-xs text-neutral-500">by {a.author}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-1 rounded inline-block"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        patch(a.id, {
                          status: a.status === "published" ? "draft" : "published",
                        })
                      }
                      className={`admin-badge cursor-pointer ${
                        a.status === "published"
                          ? "admin-badge-success hover:opacity-80"
                          : "admin-badge-warning hover:opacity-80"
                      } transition-opacity`}
                      title="Click to toggle"
                    >
                      {a.status}
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <button
                      disabled={isBusy}
                      onClick={() => patch(a.id, { isBreaking: !a.isBreaking })}
                      className={`text-xl leading-none transition-all hover:scale-125 ${a.isBreaking ? "" : "grayscale opacity-40 hover:opacity-70"}`}
                      title="Toggle breaking"
                    >
                      🚨
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <button
                      disabled={isBusy}
                      onClick={() => patch(a.id, { isFeatured: !a.isFeatured })}
                      className={`text-xl leading-none transition-all hover:scale-125 ${a.isFeatured ? "" : "grayscale opacity-40 hover:opacity-70"}`}
                      title="Toggle featured"
                    >
                      ⭐
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-right text-neutral-600 font-semibold">
                    {a.views.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/article/${a.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        disabled={isBusy}
                        onClick={() => remove(a.id, a.title)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-neutral-400">
                  <p className="text-sm">No articles match your filters.</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
