"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Article,
  Section,
  categoryMeta,
  effectiveStatus,
  formatByline,
  isArticleLive,
  timeUntil,
} from "@/lib/types";
import StarRating from "@/components/StarRating";
import PreviewLinkButton from "./PreviewLinkButton";
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

type SortKey = "newest" | "oldest" | "views" | "rating" | "title";

const SORTS: Record<SortKey, (a: Article, b: Article) => number> = {
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  oldest: (a, b) => a.publishedAt.localeCompare(b.publishedAt),
  views: (a, b) => b.views - a.views,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.views - a.views,
  title: (a, b) => a.title.localeCompare(b.title),
};

export default function ArticlesManager({
  initial,
  sections,
  previewTokens = {},
}: {
  initial: Article[];
  sections: Section[];
  previewTokens?: Record<string, string>;
}) {
  const CATEGORIES = sections;
  const [articles, setArticles] = useState<Article[]>(initial);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (status !== "all" && effectiveStatus(a) !== status) return false;
      if (query && !a.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    return [...rows].sort(SORTS[sort]);
  }, [articles, query, category, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // A filter change can strand you on a page that no longer exists.
  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
      setSelected(new Set());
    };
  }

  const allOnPageSelected = visible.length > 0 && visible.every((a) => selected.has(a.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) visible.forEach((a) => next.delete(a.id));
      else visible.forEach((a) => next.add(a.id));
      return next;
    });
  }

  async function bulk(action: string) {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (
      action === "trash" &&
      !confirm(`Move ${ids.length} ${ids.length === 1 ? "story" : "stories"} to the trash?`)
    )
      return;

    setBulkBusy(true);
    try {
      const res = await fetch("/api/articles/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) return;
      const { skipped } = await res.json();

      if (action === "trash") {
        setArticles((prev) => prev.filter((a) => !selected.has(a.id)));
      } else {
        setArticles((prev) =>
          prev.map((a) =>
            !selected.has(a.id)
              ? a
              : action === "publish"
                ? { ...a, status: "published", scheduledFor: undefined }
                : action === "unpublish"
                  ? { ...a, status: "draft" }
                  : { ...a, isFeatured: action === "feature" }
          )
        );
      }
      if (skipped > 0) {
        alert(`${skipped} ${skipped === 1 ? "story was" : "stories were"} skipped — they belong to another editor.`);
      }
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  }

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
    if (!confirm(`Move "${title}" to the trash? You can restore it later.`)) return;
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
          onChange={(e) => resetPage(setCategory)(e.target.value)}
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
          onChange={(e) => resetPage(setStatus)(e.target.value)}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={sort}
          onChange={(e) => resetPage(setSort)(e.target.value as SortKey)}
          className={selectClass}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="views">Most views</option>
          <option value="rating">Highest rated</option>
          <option value="title">Title A–Z</option>
        </select>
      </Card>

      {/* Bulk action bar — only present when something is selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-white">
          <span className="text-sm font-medium tabular-nums">
            {selected.size} selected
          </span>
          <span className="h-4 w-px bg-white/20" />
          {[
            { action: "publish", label: "Publish" },
            { action: "unpublish", label: "Unpublish" },
            { action: "feature", label: "Feature" },
            { action: "unfeature", label: "Unfeature" },
          ].map((b) => (
            <button
              key={b.action}
              disabled={bulkBusy}
              onClick={() => bulk(b.action)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {b.label}
            </button>
          ))}
          <button
            disabled={bulkBusy}
            onClick={() => bulk("trash")}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50"
          >
            Move to trash
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-zinc-400 transition-colors hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    aria-label="Select all on this page"
                    className="h-4 w-4 rounded border-zinc-300 accent-[var(--brand)]"
                  />
                </th>
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
              {visible.map((a) => {
                const meta = categoryMeta(a.category, sections);
                const isBusy = busy === a.id;
                const eff = effectiveStatus(a);
                const live = isArticleLive(a);
                const byline =
                  a.coAuthors && a.coAuthors.length > 0
                    ? formatByline(a.author, a.coAuthors).replace(/^By /, "")
                    : a.author;

                return (
                  <tr
                    key={a.id}
                    className={`transition-colors ${
                      selected.has(a.id) ? "bg-blue-50/40" : "hover:bg-zinc-50/70"
                    } ${isBusy ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggleOne(a.id)}
                        aria-label={`Select ${a.title}`}
                        className="h-4 w-4 rounded border-zinc-300 accent-[var(--brand)]"
                      />
                    </td>
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
                            status: eff === "published" ? "draft" : "published",
                          })
                        }
                        title={
                          eff === "scheduled"
                            ? "Click to publish now"
                            : eff === "published"
                              ? "Click to unpublish"
                              : "Click to publish"
                        }
                        className="cursor-pointer text-left"
                      >
                        <Badge
                          tone={
                            eff === "published"
                              ? "success"
                              : eff === "scheduled"
                                ? "info"
                                : "warning"
                          }
                        >
                          {eff}
                        </Badge>
                        {eff === "scheduled" && a.scheduledFor && (
                          <span className="mt-0.5 block text-[11px] tabular-nums text-zinc-400">
                            {timeUntil(a.scheduledFor)}
                          </span>
                        )}
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
                        {live ? (
                          <Link
                            href={`/article/${a.slug}`}
                            target="_blank"
                            title="View on site"
                            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <Icon.Eye className="h-4 w-4" />
                          </Link>
                        ) : (
                          previewTokens[a.id] && (
                            <PreviewLinkButton slug={a.slug} token={previewTokens[a.id]} />
                          )
                        )}
                        <Link
                          href={`/admin/articles/${a.id}`}
                          title="Edit"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <Icon.Pen className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/articles/${a.id}/history`}
                          title="Version history"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <Icon.Clock className="h-4 w-4" />
                        </Link>
                        <button
                          disabled={isBusy}
                          onClick={() => remove(a.id, a.title)}
                          title="Move to trash"
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

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="tabular-nums">
                {(currentPage - 1) * perPage + 1}–
                {Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
              </span>
              <select
                value={perPage}
                onChange={(e) => resetPage(setPerPage)(Number(e.target.value))}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 focus:border-zinc-400 focus:outline-none"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
            </div>

            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 text-xs tabular-nums text-zinc-500">
                  {currentPage} / {pageCount}
                </span>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
