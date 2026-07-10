"use client";

import { useState } from "react";
import { Article, categoryMeta, effectiveStatus } from "@/lib/types";
import { timeAgo } from "@/components/ArticleCard";
import { Badge, Card, EmptyState, Icon, PageHeader, microLabel } from "./ui";

export default function TrashManager({
  initial,
  canPurge,
}: {
  initial: Article[];
  canPurge: boolean;
}) {
  const [items, setItems] = useState<Article[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function restore(id: string) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/trash/${id}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not restore this story");
        return;
      }
      setItems((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusy(null);
    }
  }

  async function purge(id: string, title: string) {
    if (
      !confirm(
        `Permanently delete "${title}"?\n\nThis destroys the story and its comments. It cannot be undone.`
      )
    )
      return;
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/trash/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not delete this story");
        return;
      }
      setItems((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusy(null);
    }
  }

  const th = `px-4 py-3 text-left ${microLabel}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        subtitle={
          items.length === 0
            ? "Nothing in the trash"
            : `${items.length} ${items.length === 1 ? "story" : "stories"} — restore any of them, nothing is lost`
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            title="The trash is empty"
            description="Stories you delete land here first, so a misclick is never fatal."
            icon={<Icon.Trash className="h-8 w-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70">
                  <th className={th}>Headline</th>
                  <th className={th}>Section</th>
                  <th className={th}>Was</th>
                  <th className={th}>Trashed</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((a) => {
                  const isBusy = busy === a.id;
                  const meta = categoryMeta(a.category);
                  return (
                    <tr
                      key={a.id}
                      className={`transition-colors hover:bg-zinc-50/70 ${
                        isBusy ? "opacity-50" : ""
                      }`}
                    >
                      <td className="max-w-sm px-4 py-3.5">
                        <p className="line-clamp-1 text-sm font-medium text-zinc-900">
                          {a.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                          by {a.author}
                        </p>
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
                        <Badge tone="neutral">{effectiveStatus(a)}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs tabular-nums text-zinc-500">
                        {a.deletedAt ? timeAgo(a.deletedAt) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isBusy}
                            onClick={() => restore(a.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                          >
                            <Icon.Undo className="h-3.5 w-3.5" />
                            Restore
                          </button>
                          {canPurge && (
                            <button
                              disabled={isBusy}
                              onClick={() => purge(a.id, a.title)}
                              title="Delete permanently"
                              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Icon.Trash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!canPurge && items.length > 0 && (
        <p className="text-xs text-zinc-400">
          Only an admin can permanently delete a story.
        </p>
      )}
    </div>
  );
}
