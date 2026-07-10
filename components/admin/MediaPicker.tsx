"use client";

import { useEffect, useState } from "react";
import { MediaItemWithUsage, formatBytes } from "@/lib/types";
import { Icon, btnSecondary } from "./ui";

export default function MediaPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: { url: string; alt?: string }) => void;
}) {
  const [items, setItems] = useState<MediaItemWithUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/media")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  if (!open) return null;

  const shown = query
    ? items.filter((i) => i.filename.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Media library</h2>
          <div className="flex items-center gap-2">
            <label className={`${btnSecondary} cursor-pointer ${uploading ? "opacity-60" : ""}`}>
              <Icon.Image className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={upload}
                className="hidden"
              />
            </label>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="border-b border-zinc-100 px-5 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filenames…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
          />
        </div>

        {error && (
          <p className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="py-12 text-center text-sm text-zinc-400">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">
              No images yet. Upload one to get started.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {shown.map((m) => (
                <button
                  key={m.filename}
                  type="button"
                  onClick={() => {
                    onSelect({ url: m.url, alt: m.alt });
                    onClose();
                  }}
                  className="group overflow-hidden rounded-lg border border-zinc-200 text-left transition-all hover:border-brand hover:shadow-md"
                >
                  <span className="block aspect-[4/3] overflow-hidden bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt={m.alt ?? m.filename}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </span>
                  <span className="block px-2 py-1.5">
                    <span className="block truncate text-[11px] text-zinc-600">
                      {m.filename}
                    </span>
                    <span className="block text-[10px] tabular-nums text-zinc-400">
                      {formatBytes(m.size)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
