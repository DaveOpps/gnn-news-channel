"use client";

import { useState } from "react";
import { Correction } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Card, Icon, btnSecondary, input, microLabel } from "./ui";

/**
 * Corrections are appended, published immediately, and never silently edited —
 * so this lives on its own API, separate from the story's draft/save cycle.
 */
export default function CorrectionsEditor({
  articleId,
  initial,
  canDelete,
}: {
  articleId: string;
  initial: Correction[];
  canDelete: boolean;
}) {
  const [items, setItems] = useState<Correction[]>(initial);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    if (!note.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/articles/${articleId}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not publish the correction");
        return;
      }
      setItems(data.corrections ?? []);
      setNote("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function remove(correctionId: string) {
    if (!confirm("Remove this published correction?")) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/articles/${articleId}/corrections?correctionId=${correctionId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) setItems(data.corrections ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Corrections</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Published openly at the foot of the story. Append, never overwrite.
          </p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className={btnSecondary}>
          <Icon.Plus className="h-4 w-4" />
          Add correction
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {open && (
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
          <label className={microLabel}>What was corrected</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. An earlier version misstated the date of the summit."
            className={input}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={add}
              disabled={busy || !note.trim()}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? "Publishing…" : "Publish correction"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setNote("");
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-zinc-400">No corrections on this story.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="flex gap-3 border-l-2 border-amber-300 pl-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-700">{c.note}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {c.editorName} · {timeAgo(c.at)}
                </p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={busy}
                  title="Remove correction"
                  className="h-fit rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Icon.Trash className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
