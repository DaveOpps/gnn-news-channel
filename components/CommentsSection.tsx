"use client";

import { useState } from "react";
import { CommentThread } from "@/lib/types";

function timeAgoShort(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommentsSection({
  articleId,
  initial,
}: {
  articleId: string;
  initial: CommentThread[];
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, name, text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not post your comment");
        return;
      }
      setSubmitted(true);
      setName("");
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-12 bg-white border border-hairline-strong p-6 md:p-10">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-hairline">
        <span className="w-1.5 h-6 bg-brand"></span>
        <h2 className="font-semibold text-xl uppercase tracking-wide text-ink">
          Comments ({initial.length})
        </h2>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 mb-8">
          ✓ Thanks! Your comment was submitted and will appear once approved by our
          moderators.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-10 space-y-3 max-w-2xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            placeholder="Your name"
            className="w-full border border-hairline-strong px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            maxLength={2000}
            rows={4}
            placeholder="Join the conversation… (comments are moderated)"
            className="w-full border border-hairline-strong px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-ink hover:bg-black disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 transition-colors"
          >
            {sending ? "Posting…" : "Post comment"}
          </button>
        </form>
      )}

      {initial.length === 0 ? (
        <p className="text-neutral-gray text-sm">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <ul className="space-y-6">
          {initial.map((c) => (
            <li key={c.id} className="flex gap-4">
              <span
                className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-semibold text-sm shrink-0"
                aria-hidden
              >
                {c.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-ink">{c.name}</span>{" "}
                  <span className="text-neutral-gray text-xs">
                    · {timeAgoShort(c.createdAt)}
                  </span>
                </p>
                <p className="text-sm text-neutral-700 mt-1 leading-relaxed whitespace-pre-line">
                  {c.text}
                </p>

                {c.replies.length > 0 && (
                  <ul className="mt-4 space-y-4 border-l-2 border-hairline pl-4">
                    {c.replies.map((r) => (
                      <li key={r.id}>
                        <p className="text-sm">
                          <span className="font-semibold text-ink">{r.name}</span>
                          {r.isEditorReply && (
                            <span className="ml-2 bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white align-middle">
                              Editor
                            </span>
                          )}{" "}
                          <span className="text-neutral-gray text-xs">
                            · {timeAgoShort(r.createdAt)}
                          </span>
                        </p>
                        <p className="text-sm text-neutral-700 mt-1 leading-relaxed whitespace-pre-line">
                          {r.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
