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
        <h1 className="font-black text-2xl">Articles ({filtered.length})</h1>
        <Link
          href="/admin/articles/new"
          className="bg-brand hover:bg-brand-dark text-white font-bold text-sm px-5 py-2.5 uppercase tracking-wider transition-colors"
        >
          + New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm p-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles…"
          className="flex-1 min-w-48 border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:border-brand"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand"
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
          className="border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">Title</th>
              <th className="px-3 py-3">Section</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-center">Breaking</th>
              <th className="px-3 py-3 text-center">Featured</th>
              <th className="px-3 py-3 text-right">Views</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((a) => {
              const meta = categoryMeta(a.category);
              const isBusy = busy === a.id;
              return (
                <tr key={a.id} className={isBusy ? "opacity-50" : ""}>
                  <td className="px-5 py-3.5 max-w-md">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="font-semibold hover:text-brand line-clamp-1"
                    >
                      {a.title}
                    </Link>
                    <span className="text-xs text-neutral-400">by {a.author}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5"
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
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full transition-colors ${
                        a.status === "published"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                      title="Click to toggle"
                    >
                      {a.status}
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <button
                      disabled={isBusy}
                      onClick={() => patch(a.id, { isBreaking: !a.isBreaking })}
                      className={`text-lg leading-none ${a.isBreaking ? "" : "grayscale opacity-30"}`}
                      title="Toggle breaking"
                    >
                      🚨
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <button
                      disabled={isBusy}
                      onClick={() => patch(a.id, { isFeatured: !a.isFeatured })}
                      className={`text-lg leading-none ${a.isFeatured ? "" : "grayscale opacity-30"}`}
                      title="Toggle featured"
                    >
                      ⭐
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-right text-neutral-500">
                    {a.views.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/article/${a.slug}`}
                      target="_blank"
                      className="text-xs font-semibold text-neutral-500 hover:text-ink mr-3"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      disabled={isBusy}
                      onClick={() => remove(a.id, a.title)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-neutral-400">
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
