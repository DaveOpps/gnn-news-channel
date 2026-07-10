"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Revision } from "@/lib/types";
import { diffLines, collapseContext, diffStats } from "@/lib/diff";
import { timeAgo } from "@/lib/format";
import { Badge, Card, EmptyState, Icon, PageHeader, btnPrimary, microLabel } from "./ui";

export default function RevisionHistory({
  article,
  revisions,
}: {
  article: { id: string; title: string; body: string; slug: string };
  revisions: Revision[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(revisions[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = revisions.find((r) => r.id === selectedId);

  async function restore(rev: Revision) {
    if (
      !confirm(
        `Restore the version from ${new Date(rev.at).toLocaleString()}?\n\nThe current version is saved to history first, so this is undoable.`
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/revisions/${rev.id}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not restore this version");
        return;
      }
      router.push(`/admin/articles/${article.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const rows = selected
    ? collapseContext(diffLines(selected.body, article.body))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Version history"
        subtitle={article.title}
        action={
          <Link
            href={`/admin/articles/${article.id}`}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Back to story
          </Link>
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {revisions.length === 0 ? (
        <Card>
          <EmptyState
            title="No earlier versions yet"
            description="A version is saved each time the story's content changes."
            icon={<Icon.Clock className="h-8 w-8" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
          {/* Timeline */}
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
              <h2 className="text-sm font-semibold text-zinc-900">
                Versions
                <span className="ml-2 text-xs font-normal tabular-nums text-zinc-400">
                  {revisions.length}
                </span>
              </h2>
            </div>
            <ul className="max-h-[32rem] divide-y divide-zinc-100 overflow-y-auto">
              <li className="bg-emerald-50/40 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">Current version</p>
                  <Badge tone="success">live</Badge>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">What readers see now</p>
              </li>

              {revisions.map((r) => {
                const stats = diffStats(r.body, article.body);
                const active = r.id === selectedId;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full px-5 py-3.5 text-left transition-colors ${
                        active ? "bg-zinc-50" : "hover:bg-zinc-50/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {r.editorName}
                        </p>
                        <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                          {timeAgo(r.at)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{r.title}</p>
                      <p className="mt-1.5 flex gap-2 text-[11px] tabular-nums">
                        {stats.added > 0 && (
                          <span className="text-emerald-600">+{stats.added}</span>
                        )}
                        {stats.removed > 0 && (
                          <span className="text-red-600">−{stats.removed}</span>
                        )}
                        {stats.added === 0 && stats.removed === 0 && (
                          <span className="text-zinc-400">body unchanged</span>
                        )}
                        <span className="text-zinc-400">since this version</span>
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Diff */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Changes since {selected ? new Date(selected.at).toLocaleString() : "—"}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  <span className="text-red-600">Red</span> was removed,{" "}
                  <span className="text-emerald-600">green</span> was added
                </p>
              </div>
              {selected && (
                <button
                  onClick={() => restore(selected)}
                  disabled={busy}
                  className={btnPrimary}
                >
                  <Icon.Undo className="h-4 w-4" />
                  {busy ? "Restoring…" : "Restore this version"}
                </button>
              )}
            </div>

            {selected && (
              <>
                {selected.title !== article.title && (
                  <div className="border-b border-zinc-100 px-5 py-3">
                    <p className={microLabel}>Headline</p>
                    <p className="mt-1 text-sm text-red-700 line-through">{selected.title}</p>
                    <p className="text-sm text-emerald-700">{article.title}</p>
                  </div>
                )}

                <div className="max-h-[32rem] overflow-y-auto p-1 font-mono text-[13px] leading-relaxed">
                  {rows.length === 0 ? (
                    <p className="p-5 font-sans text-sm text-zinc-400">
                      The body is identical to the current version.
                    </p>
                  ) : (
                    rows.map((row, i) =>
                      row.type === "gap" ? (
                        <p
                          key={i}
                          className="my-1 select-none px-4 py-1 text-center font-sans text-[11px] text-zinc-400"
                        >
                          ⋯ {row.count} unchanged {row.count === 1 ? "line" : "lines"}
                        </p>
                      ) : (
                        <p
                          key={i}
                          className={`whitespace-pre-wrap px-4 py-0.5 ${
                            row.type === "add"
                              ? "bg-emerald-50 text-emerald-900"
                              : row.type === "remove"
                                ? "bg-red-50 text-red-900"
                                : "text-zinc-600"
                          }`}
                        >
                          <span className="mr-2 select-none text-zinc-400">
                            {row.type === "add" ? "+" : row.type === "remove" ? "−" : " "}
                          </span>
                          {row.text || " "}
                        </p>
                      )
                    )
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
