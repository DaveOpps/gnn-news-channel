"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Article, Comment } from "@/lib/types";
import { Badge, Card, EmptyState, Icon, PageHeader } from "./ui";

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

  const counts = {
    pending: pendingCount,
    approved: comments.filter((c) => c.status === "approved").length,
    all: comments.length,
  };

  const tab = (value: typeof filter, label: string) => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
        filter === value
          ? "bg-white font-medium text-zinc-900 shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
          : "text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {label}
      <span className="ml-1.5 text-xs tabular-nums text-zinc-400">{counts[value]}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comments"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} awaiting moderation`
            : "Moderation queue is clear"
        }
        action={
          <div className="inline-flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {tab("pending", "Pending")}
            {tab("approved", "Approved")}
            {tab("all", "All")}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={
              filter === "pending"
                ? "Nothing waiting for review"
                : "No comments here yet"
            }
            description={
              filter === "pending"
                ? "New reader comments will appear here for approval."
                : undefined
            }
            icon={<Icon.Comments className="h-8 w-8" />}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const article = titleById.get(c.articleId);
            const isBusy = busy === c.id;
            return (
              <Card key={c.id} className={`p-5 ${isBusy ? "opacity-50" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                      <Badge tone={c.status === "approved" ? "success" : "warning"}>
                        {c.status}
                      </Badge>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                      {c.text}
                    </p>

                    <p className="mt-3 text-xs text-zinc-400">
                      {new Date(c.createdAt).toLocaleString()} ·{" "}
                      {article ? (
                        <Link
                          href={`/article/${article.slug}`}
                          target="_blank"
                          className="text-zinc-500 transition-colors hover:text-brand"
                        >
                          {article.title}
                        </Link>
                      ) : (
                        <em>deleted article</em>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {c.status === "pending" ? (
                      <button
                        disabled={isBusy}
                        onClick={() => setStatus(c.id, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Icon.Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                    ) : (
                      <button
                        disabled={isBusy}
                        onClick={() => setStatus(c.id, "pending")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <Icon.Undo className="h-3.5 w-3.5" />
                        Unapprove
                      </button>
                    )}
                    <button
                      disabled={isBusy}
                      onClick={() => remove(c.id)}
                      title="Delete comment"
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Icon.Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
