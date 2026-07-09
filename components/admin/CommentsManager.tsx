"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Article, Comment } from "@/lib/types";

export default function CommentsManager({
  initial,
  articles,
}: {
  initial: Comment[];
  articles: Pick<Article, "id" | "title" | "slug">[];
}) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const titleById = useMemo(
    () => new Map(articles.map((a) => [a.id, a])),
    [articles]
  );

  const filtered = comments.filter((c) => filter === "all" || c.status === filter);
  const pendingCount = comments.filter((c) => c.status === "pending").length;

  async function setStatus(id: string, status: "approved" | "pending") {
    setBusy(id);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated: Comment = await res.json();
        setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment permanently?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setBusy(null);
    }
  }

  const tab = (value: typeof filter, label: string, count?: number) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
        filter === value
          ? "border-b-brand text-neutral-900"
          : "border-b-transparent text-neutral-500 hover:text-neutral-700"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-2xl text-neutral-900">Comments</h1>
          <p className="text-sm text-neutral-500">{filtered.length} in this view</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 bg-white admin-card rounded-none border-x-0 border-t-0">
        {tab("pending", "Pending", pendingCount > 0 ? pendingCount : undefined)}
        {tab("approved", "Approved")}
        {tab("all", "All")}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-card px-6 py-16 text-center">
          <p className="text-lg text-neutral-400 mb-2">
            {filter === "pending"
              ? "🎉 No comments waiting for review"
              : "No comments here yet"}
          </p>
          <p className="text-sm text-neutral-400">
            {filter === "pending"
              ? "Check back soon for new submissions"
              : "Comments will appear here once submitted"}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((c) => {
            const article = titleById.get(c.articleId);
            const isBusy = busy === c.id;
            return (
              <li
                key={c.id}
                className={`admin-card p-6 border-l-4 transition-all ${
                  c.status === "pending"
                    ? "border-l-amber-400"
                    : "border-l-green-400"
                } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-neutral-900">{c.name}</p>
                      <span
                        className={`admin-badge ${
                          c.status === "approved"
                            ? "admin-badge-success"
                            : "admin-badge-warning"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line mb-3">
                      {c.text}
                    </p>
                    <p className="text-xs text-neutral-500 flex flex-wrap gap-2 items-center">
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                      <span className="text-neutral-300">·</span>
                      <span>on</span>
                      {article ? (
                        <Link
                          href={`/article/${article.slug}`}
                          target="_blank"
                          className="text-brand font-semibold hover:underline"
                        >
                          {article.title}
                        </Link>
                      ) : (
                        <em className="text-neutral-400">deleted article</em>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 sm:flex-col">
                    {c.status === "pending" ? (
                      <button
                        disabled={isBusy}
                        onClick={() => setStatus(c.id, "approved")}
                        className="admin-button admin-button-primary text-xs px-4 py-2"
                      >
                        ✓ Approve
                      </button>
                    ) : (
                      <button
                        disabled={isBusy}
                        onClick={() => setStatus(c.id, "pending")}
                        className="admin-button text-xs px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        Unapprove
                      </button>
                    )}
                    <button
                      disabled={isBusy}
                      onClick={() => remove(c.id)}
                      className="admin-button text-xs px-4 py-2 bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
