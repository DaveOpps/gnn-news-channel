"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Article, Comment, CommentStatus, ModerationSettings } from "@/lib/types";
import { Badge, Card, EmptyState, Icon, PageHeader, btnPrimary, btnSecondary, input, microLabel } from "./ui";

type Tab = "pending" | "approved" | "spam" | "all";

export default function CommentsManager({
  initial,
  articles,
  moderation,
  isAdmin,
}: {
  initial: Comment[];
  articles: Pick<Article, "id" | "title" | "slug">[];
  moderation: ModerationSettings;
  isAdmin: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [filter, setFilter] = useState<Tab>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [terms, setTerms] = useState(moderation.blockedTerms.join("\n"));
  const [names, setNames] = useState(moderation.blockedNames.join("\n"));
  const [savingFilters, setSavingFilters] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const titleById = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);

  const counts = {
    pending: comments.filter((c) => c.status === "pending").length,
    approved: comments.filter((c) => c.status === "approved").length,
    spam: comments.filter((c) => c.status === "spam").length,
    all: comments.length,
  };

  // Replies live under their parent, never as standalone rows in the queue.
  const filtered = comments
    .filter((c) => !c.parentId)
    .filter((c) => filter === "all" || c.status === filter);

  const repliesOf = (id: string) =>
    comments.filter((c) => c.parentId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  async function setStatus(id: string, status: CommentStatus) {
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
    if (!confirm("Delete this comment? Any replies to it go too.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
    } finally {
      setBusy(null);
    }
  }

  async function bulk(action: "approve" | "spam" | "delete") {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} comments and their replies?`)) return;

    setBulkBusy(true);
    try {
      const res = await fetch("/api/comments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) return;
      if (action === "delete") {
        setComments((prev) => prev.filter((c) => !selected.has(c.id) && !selected.has(c.parentId ?? "")));
      } else {
        const status: CommentStatus = action === "approve" ? "approved" : "spam";
        setComments((prev) => prev.map((c) => (selected.has(c.id) ? { ...c, status } : c)));
      }
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  }

  async function sendReply(parentId: string) {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/comments/${parentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not post the reply" });
        return;
      }
      setComments((prev) => [...prev, data as Comment]);
      setReplyText("");
      setReplyTo(null);
    } finally {
      setReplying(false);
    }
  }

  async function saveFilters() {
    setSavingFilters(true);
    setMessage(null);
    try {
      const res = await fetch("/api/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedTerms: terms, blockedNames: names }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not save filters" });
        return;
      }
      setMessage({ ok: true, text: "Filters saved. New comments matching them go straight to spam." });
    } finally {
      setSavingFilters(false);
    }
  }

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const tab = (value: Tab, label: string) => (
    <button
      key={value}
      onClick={() => {
        setFilter(value);
        setSelected(new Set());
      }}
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
          counts.pending > 0
            ? `${counts.pending} awaiting moderation`
            : "Moderation queue is clear"
        }
        action={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => setShowFilters((v) => !v)} className={btnSecondary}>
                <Icon.Alert className="h-4 w-4" />
                Word filters
              </button>
            )}
            <div className="inline-flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
              {tab("pending", "Pending")}
              {tab("approved", "Approved")}
              {tab("spam", "Spam")}
              {tab("all", "All")}
            </div>
          </div>
        }
      />

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {isAdmin && showFilters && (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Word filters</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              One per line. A new comment containing any of these is quarantined as spam
              instead of reaching the queue. Existing comments are unaffected.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={`mb-1.5 block ${microLabel}`}>Blocked words or phrases</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={5}
                placeholder={"buy now\ncrypto giveaway"}
                className={`${input} font-mono text-xs`}
              />
            </div>
            <div>
              <label className={`mb-1.5 block ${microLabel}`}>Blocked commenter names</label>
              <textarea
                value={names}
                onChange={(e) => setNames(e.target.value)}
                rows={5}
                placeholder={"spambot\ntroll99"}
                className={`${input} font-mono text-xs`}
              />
            </div>
          </div>
          <button onClick={saveFilters} disabled={savingFilters} className={btnPrimary}>
            {savingFilters ? "Saving…" : "Save filters"}
          </button>
        </Card>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-white">
          <span className="text-sm font-medium tabular-nums">{selected.size} selected</span>
          <span className="h-4 w-px bg-white/20" />
          <button
            disabled={bulkBusy}
            onClick={() => bulk("approve")}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => bulk("spam")}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Mark as spam
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => bulk("delete")}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-zinc-400 transition-colors hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={
              filter === "pending"
                ? "Nothing waiting for review"
                : filter === "spam"
                  ? "The spam tray is empty"
                  : "No comments here yet"
            }
            icon={<Icon.Comments className="h-8 w-8" />}
          />
        </Card>
      ) : (
        <>
          <label className="flex items-center gap-2.5 px-1 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelected(allSelected ? new Set() : new Set(filtered.map((c) => c.id)))
              }
              className="h-4 w-4 rounded border-zinc-300 accent-[var(--brand)]"
            />
            Select all {filtered.length}
          </label>

          <div className="space-y-3">
            {filtered.map((c) => {
              const article = titleById.get(c.articleId);
              const isBusy = busy === c.id;
              const replies = repliesOf(c.id);
              return (
                <Card key={c.id} className={`p-5 ${isBusy ? "opacity-50" : ""}`}>
                  <div className="flex gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                          return next;
                        })
                      }
                      aria-label={`Select comment by ${c.name}`}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 accent-[var(--brand)]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                              {c.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                            <Badge
                              tone={
                                c.status === "approved"
                                  ? "success"
                                  : c.status === "spam"
                                    ? "brand"
                                    : "warning"
                              }
                            >
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
                          {c.status !== "approved" && (
                            <button
                              disabled={isBusy}
                              onClick={() => setStatus(c.id, "approved")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Icon.Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}
                          {c.status === "approved" && (
                            <button
                              disabled={isBusy}
                              onClick={() => setStatus(c.id, "pending")}
                              className={`${btnSecondary} px-3 py-1.5 text-xs`}
                            >
                              <Icon.Undo className="h-3.5 w-3.5" />
                              Unapprove
                            </button>
                          )}
                          {c.status !== "spam" && (
                            <button
                              disabled={isBusy}
                              onClick={() => setStatus(c.id, "spam")}
                              title="Mark as spam"
                              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Icon.Alert className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            disabled={isBusy}
                            onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                            title="Reply as the newsroom"
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <Icon.Comments className="h-4 w-4" />
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => remove(c.id)}
                            title="Delete comment"
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Icon.Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Existing replies */}
                      {replies.length > 0 && (
                        <ul className="mt-4 space-y-3 border-l-2 border-zinc-100 pl-4">
                          {replies.map((r) => (
                            <li key={r.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-900">{r.name}</span>
                                {r.isEditorReply && <Badge tone="info">Editor</Badge>}
                                <span className="text-xs text-zinc-400">
                                  {new Date(r.createdAt).toLocaleString()}
                                </span>
                                <button
                                  onClick={() => remove(r.id)}
                                  title="Delete reply"
                                  className="ml-auto rounded p-1 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <Icon.Trash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
                                {r.text}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Reply composer */}
                      {replyTo === c.id && (
                        <div className="mt-4 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder="Reply publicly as the newsroom…"
                            className={input}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => sendReply(c.id)}
                              disabled={replying || !replyText.trim()}
                              className={`${btnPrimary} px-3 py-1.5 text-xs`}
                            >
                              {replying ? "Posting…" : "Post reply"}
                            </button>
                            <button
                              onClick={() => {
                                setReplyTo(null);
                                setReplyText("");
                              }}
                              className="text-xs text-zinc-500 hover:text-zinc-900"
                            >
                              Cancel
                            </button>
                            <span className="ml-auto text-[11px] text-zinc-400">
                              Published immediately, badged as Editor
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
