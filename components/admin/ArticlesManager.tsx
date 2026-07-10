"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Article, CATEGORIES, categoryMeta, formatByline } from "@/lib/types";
import StarRating from "@/components/StarRating";
import {
  Badge,
  Card,
  EmptyState,
  Icon,
  PageHeader,
  btnPrimary,
  input,
  microLabel,
} from "./ui";

const selectClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-shadow focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5";

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

  const th = `px-4 py-3 text-left ${microLabel}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles"
        subtitle={`${filtered.length} of ${articles.length} ${
          articles.length === 1 ? "story" : "stories"
        }`}
        action={
          <Link href="/admin/articles/new" className={btnPrimary}>
            <Icon.Plus className="h-4 w-4" />
            New article
          </Link>
        }
      />

      {/* Filters */}
      <Card className="flex flex-wrap gap-3 p-4">
        <div className="relative min-w-56 flex-1">
          <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines…"
            className={`${input} pl-9`}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
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
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70">
                <th className={th}>Headline</th>
                <th className={th}>Section</th>
                <th className={th}>Status</th>
                <th className={`${th} text-center`}>Flags</th>
                <th className={`${th} text-center`}>Rating</th>
                <th className={`${th} text-right`}>Views</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((a) => {
                const meta = categoryMeta(a.category);
                const isBusy = busy === a.id;
                const byline =
                  a.coAuthors && a.coAuthors.length > 0
                    ? formatByline(a.author, a.coAuthors).replace(/^By /, "")
                    : a.author;

                return (
                  <tr
                    key={a.id}
                    className={`transition-colors hover:bg-zinc-50/70 ${
                      isBusy ? "opacity-50" : ""
                    }`}
                  >
                    <td className="max-w-sm px-4 py-3.5">
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="line-clamp-1 text-sm font-medium text-zinc-900 transition-colors hover:text-brand"
                      >
                        {a.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{byline}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden
                        />
                        {meta.label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          patch(a.id, {
                            status: a.status === "published" ? "draft" : "published",
                          })
                        }
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        <Badge tone={a.status === "published" ? "success" : "warning"}>
                          {a.status}
                        </Badge>
                      </button>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          disabled={isBusy}
                          onClick={() => patch(a.id, { isBreaking: !a.isBreaking })}
                          title={a.isBreaking ? "Breaking — click to unset" : "Mark as breaking"}
                          aria-pressed={a.isBreaking}
                          className={`rounded-md p-1.5 ring-1 ring-inset transition-colors ${
                            a.isBreaking
                              ? "bg-red-50 text-red-600 ring-red-600/20"
                              : "text-zinc-300 ring-transparent hover:bg-zinc-50 hover:text-zinc-500"
                          }`}
                        >
                          <Icon.Alert className="h-4 w-4" />
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => patch(a.id, { isFeatured: !a.isFeatured })}
                          title={a.isFeatured ? "Featured — click to unset" : "Mark as featured"}
                          aria-pressed={a.isFeatured}
                          className={`rounded-md p-1.5 text-base leading-none ring-1 ring-inset transition-colors ${
                            a.isFeatured
                              ? "bg-amber-50 text-amber-500 ring-amber-500/20"
                              : "text-zinc-300 ring-transparent hover:bg-zinc-50 hover:text-zinc-500"
                          }`}
                        >
                          <span className="block h-4 w-4 text-[15px] leading-4">★</span>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex justify-center">
                        <StarRating
                          value={a.rating ?? 0}
                          onChange={(v) => patch(a.id, { rating: v })}
                          size="sm"
                          disabled={isBusy}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm tabular-nums text-zinc-600">
                      {a.views.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/article/${a.slug}`}
                          target="_blank"
                          title="View on site"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <Icon.Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/articles/${a.id}`}
                          title="Edit"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <Icon.Pen className="h-4 w-4" />
                        </Link>
                        <button
                          disabled={isBusy}
                          onClick={() => remove(a.id, a.title)}
                          title="Delete"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Icon.Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            title="No articles match your filters"
            description="Try clearing the search or changing the section."
            icon={<Icon.Articles className="h-8 w-8" />}
          />
        )}
      </Card>
    </div>
  );
}
