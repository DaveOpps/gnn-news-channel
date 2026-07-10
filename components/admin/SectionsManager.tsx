"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Section, slugifySection } from "@/lib/types";
import { Badge, Card, Icon, PageHeader, btnPrimary, input, microLabel } from "./ui";

const SWATCHES = [
  "#b91c1c", "#c2410c", "#b45309", "#047857",
  "#0e7490", "#1d4ed8", "#6d28d9", "#be185d", "#71717a",
];

export default function SectionsManager({
  initial,
  counts,
}: {
  initial: Section[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(SWATCHES[0]);
  const [adding, setAdding] = useState(false);

  async function save(slug: string, patch: { label?: string; color?: string }) {
    setBusy(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/sections/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not save" });
        return;
      }
      setSections((prev) => prev.map((s) => (s.slug === slug ? data : s)));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function move(index: number, delta: number) {
    const next = [...sections];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);

    await fetch("/api/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: next.map((s) => s.slug) }),
    });
    router.refresh();
  }

  async function remove(section: Section) {
    const count = counts[section.slug] ?? 0;
    if (count > 0) {
      setMessage({
        ok: false,
        text: `“${section.label}” still holds ${count} ${count === 1 ? "story" : "stories"}. Move them to another section first.`,
      });
      return;
    }
    if (!confirm(`Delete the “${section.label}” section?`)) return;

    setBusy(section.slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/sections/${section.slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not delete" });
        return;
      }
      setSections((prev) => prev.filter((s) => s.slug !== section.slug));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, color: newColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not create the section" });
        return;
      }
      setSections((prev) => [...prev, data]);
      setNewLabel("");
      setMessage({ ok: true, text: `“${data.label}” added. It appears in the site nav immediately.` });
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  const previewSlug = slugifySection(newLabel);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Sections"
        subtitle="The desks your stories are filed under, and the site navigation."
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

      <Card className="overflow-hidden">
        <div className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Current sections
            <span className="ml-2 text-xs font-normal tabular-nums text-zinc-400">
              {sections.length}
            </span>
          </h2>
        </div>

        <ul className="divide-y divide-zinc-100">
          {sections.map((s, i) => {
            const count = counts[s.slug] ?? 0;
            const isBusy = busy === s.slug;
            return (
              <li
                key={s.slug}
                className={`flex flex-wrap items-center gap-3 px-5 py-4 ${isBusy ? "opacity-50" : ""}`}
              >
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                    className="rounded px-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === sections.length - 1}
                    title="Move down"
                    className="rounded px-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>

                <input
                  type="color"
                  value={s.color}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((x) => (x.slug === s.slug ? { ...x, color: e.target.value } : x))
                    )
                  }
                  onBlur={(e) => save(s.slug, { color: e.target.value })}
                  title="Section colour"
                  className="h-7 w-7 shrink-0 cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                />

                <input
                  defaultValue={s.label}
                  onBlur={(e) => e.target.value !== s.label && save(s.slug, { label: e.target.value })}
                  className="min-w-32 flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-medium text-zinc-900 hover:border-zinc-200 focus:border-zinc-400 focus:outline-none"
                />

                <code className="shrink-0 rounded bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">
                  /category/{s.slug}
                </code>

                <Badge tone={count > 0 ? "neutral" : "warning"}>
                  {count} {count === 1 ? "story" : "stories"}
                </Badge>

                <button
                  onClick={() => remove(s)}
                  disabled={isBusy || sections.length <= 1}
                  title={
                    sections.length <= 1
                      ? "A newsroom needs at least one section"
                      : count > 0
                        ? "Still holds stories"
                        : "Delete section"
                  }
                  className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                >
                  <Icon.Trash className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-6">
        <form onSubmit={add} className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Add a section</h2>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label className={`mb-1.5 block ${microLabel}`}>Name</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Opinion"
                className={input}
              />
            </div>
            <button type="submit" disabled={adding || !newLabel.trim()} className={btnPrimary}>
              <Icon.Plus className="h-4 w-4" />
              {adding ? "Adding…" : "Add section"}
            </button>
          </div>

          <div>
            <label className={`mb-1.5 block ${microLabel}`}>Colour</label>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  style={{ backgroundColor: c }}
                  aria-label={`Use ${c}`}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    newColor === c ? "scale-110 ring-2 ring-zinc-900 ring-offset-2" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {previewSlug && (
            <p className="text-xs text-zinc-400">
              URL will be <code className="rounded bg-zinc-50 px-1.5 py-0.5">/category/{previewSlug}</code>{" "}
              — the slug is fixed once created, so links never rot.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
