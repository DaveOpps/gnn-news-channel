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

  const tab = (value: typeof filter, label: string) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
        filter === value
          ? "bg-ink text-white"
          : "bg-white text-neutral-500 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-black text-2xl">
          Comments{" "}
          {pendingCount > 0 && (
            <span className="ml-2 text-sm bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full align-middle">
              {pendingCount} awaiting review
            </span>
          )}
        </h1>
        <div className="flex shadow-sm">
          {tab("pending", "Pending")}
          {tab("approved", "Approved")}
          {tab("all", "All")}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white shadow-sm px-6 py-16 text-center text-neutral-400">
          {filter === "pending"
            ? "🎉 No comments waiting for review."
            : "No comments here yet."}
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((c) => {
            const article = titleById.get(c.articleId);
            const isBusy = busy === c.id;
            return (
              <li
                key={c.id}
                className={`bg-white shadow-sm p-5 ${isBusy ? "opacity-50" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-bold">{c.name}</span>{" "}
                      <span
                        className={`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          c.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </p>
                    <p className="text-sm text-neutral-700 mt-2 leading-relaxed whitespace-pre-line">
                      {c.text}
                    </p>
                    <p className="text-xs text-neutral-400 mt-3">
                      {new Date(c.createdAt).toLocaleString()} · on{" "}
                      {article ? (
                        <Link
                          href={`/article/${article.slug}`}
                          target="_blank"
                          className="text-brand hover:underline"
                        >
                          {article.title}
                        </Link>
                      ) : (
                        <em>deleted article</em>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {c.status === "pending" ? (
                      <button
                        disabled={isBusy}
                        onClick={() => setStatus(c.id, "approved")}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors"
                      >
                        ✓ Approve
                      </button>
                    ) : (
                      <button
                        disabled={isBusy}
                        onClick={() => setStatus(c.id, "pending")}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors"
                      >
                        Unapprove
                      </button>
                    )}
                    <button
                      disabled={isBusy}
                      onClick={() => remove(c.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors"
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
