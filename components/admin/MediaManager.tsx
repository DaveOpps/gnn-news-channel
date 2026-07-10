"use client";

import { useState } from "react";
import Link from "next/link";
import { MediaItemWithUsage, formatBytes } from "@/lib/types";
import { Badge, Card, EmptyState, Icon, PageHeader, btnSecondary, microLabel } from "./ui";

export default function MediaManager({
  initial,
  canDelete,
}: {
  initial: MediaItemWithUsage[];
  canDelete: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const orphans = items.filter((m) => m.usedBy.length === 0).length;
  const totalBytes = items.reduce((s, m) => s + m.size, 0);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setItems((prev) => [{ ...data, usedBy: [] }, ...prev]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function remove(m: MediaItemWithUsage) {
    if (!confirm(`Delete ${m.filename}? This cannot be undone.`)) return;
    setBusy(m.filename);
    setError("");
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(m.filename)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not delete");
        return;
      }
      setItems((prev) => prev.filter((x) => x.filename !== m.filename));
    } finally {
      setBusy(null);
    }
  }

  async function saveAlt(m: MediaItemWithUsage, alt: string) {
    setItems((prev) =>
      prev.map((x) => (x.filename === m.filename ? { ...x, alt } : x))
    );
    await fetch(`/api/media/${encodeURIComponent(m.filename)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt }),
    });
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media"
        subtitle={
          items.length === 0
            ? "No images uploaded yet"
            : `${items.length} images · ${formatBytes(totalBytes)}${
                orphans ? ` · ${orphans} unused` : ""
              }`
        }
        action={
          <label className={`${btnSecondary} cursor-pointer ${uploading ? "opacity-60" : ""}`}>
            <Icon.Image className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={upload}
              className="hidden"
            />
          </label>
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="The library is empty"
            description="Images you upload from any story appear here."
            icon={<Icon.Image className="h-8 w-8" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => {
            const isBusy = busy === m.filename;
            return (
              <Card key={m.filename} className={`overflow-hidden ${isBusy ? "opacity-50" : ""}`}>
                <div className="aspect-[4/3] bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.alt ?? m.filename}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-800">
                      {m.filename}
                    </p>
                    {m.usedBy.length > 0 ? (
                      <Badge tone="success">in use</Badge>
                    ) : (
                      <Badge tone="neutral">unused</Badge>
                    )}
                  </div>

                  <p className="text-[11px] tabular-nums text-zinc-400">
                    {formatBytes(m.size)}
                    {m.uploadedBy && ` · ${m.uploadedBy}`}
                  </p>

                  <div>
                    <label className={`mb-1 block ${microLabel}`}>Alt text</label>
                    <input
                      defaultValue={m.alt ?? ""}
                      onBlur={(e) => saveAlt(m, e.target.value)}
                      placeholder="Describe the image"
                      className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs focus:border-zinc-400 focus:outline-none"
                    />
                  </div>

                  {m.usedBy.length > 0 && (
                    <p className="truncate text-[11px] text-zinc-500">
                      Used by{" "}
                      {m.usedBy.slice(0, 2).map((u, i) => (
                        <span key={u.id}>
                          {i > 0 && ", "}
                          <Link
                            href={`/admin/articles/${u.id}`}
                            className="text-zinc-700 underline-offset-2 hover:underline"
                          >
                            {u.title}
                          </Link>
                        </span>
                      ))}
                      {m.usedBy.length > 2 && ` +${m.usedBy.length - 2} more`}
                    </p>
                  )}

                  <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
                    <button
                      onClick={() => copyUrl(m.url)}
                      className="flex-1 rounded-md border border-zinc-200 px-2 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                    >
                      {copied === m.url ? "✓ Copied" : "Copy URL"}
                    </button>
                    {canDelete && (
                      <button
                        disabled={isBusy || m.usedBy.length > 0}
                        onClick={() => remove(m)}
                        title={
                          m.usedBy.length > 0
                            ? "Still used by a story"
                            : "Delete permanently"
                        }
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                      >
                        <Icon.Trash className="h-4 w-4" />
                      </button>
                    )}
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
