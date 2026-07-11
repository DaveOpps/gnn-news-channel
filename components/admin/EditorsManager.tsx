"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditorAvatar from "@/components/EditorAvatar";
import { EditorRole, PublicEditor } from "@/lib/types";
import {
  Badge,
  Card,
  EmptyState,
  Icon,
  PageHeader,
  btnPrimary,
  input,
  microLabel,
} from "./ui";

type Draft = {
  name: string;
  username: string;
  password: string;
  title: string;
  bio: string;
  role: EditorRole;
  photoUrl: string;
};

const EMPTY: Draft = {
  name: "",
  username: "",
  password: "",
  title: "",
  bio: "",
  role: "editor",
  photoUrl: "",
};

export default function EditorsManager({
  initial,
  currentEditorId,
}: {
  initial: PublicEditor[];
  currentEditorId: string;
}) {
  const router = useRouter();
  const [editors, setEditors] = useState(initial);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isNew = editingId === null;

  function reset() {
    setDraft(EMPTY);
    setEditingId(null);
    setError("");
  }

  function startEdit(e: PublicEditor) {
    setEditingId(e.id);
    setError("");
    setDraft({
      name: e.name,
      username: e.username,
      password: "", // blank = keep existing
      title: e.title ?? "",
      bio: e.bio ?? "",
      role: e.role,
      photoUrl: e.photoUrl ?? "",
    });
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
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
        setError(data.error ?? "Photo upload failed");
        return;
      }
      setDraft((d) => ({ ...d, photoUrl: data.url }));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setBusy(true);
    try {
      const url = isNew ? "/api/editors" : `/api/editors/${editingId}`;
      const method = isNew ? "POST" : "PUT";
      const payload: Record<string, unknown> = {
        name: draft.name,
        username: draft.username,
        title: draft.title,
        bio: draft.bio,
        role: draft.role,
        photoUrl: draft.photoUrl,
      };
      // On edit, an empty password means "leave it unchanged".
      if (isNew || draft.password) payload.password = draft.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save editor");
        return;
      }
      setEditors((list) =>
        isNew ? [...list, data as PublicEditor] : list.map((e) => (e.id === editingId ? data : e))
      );
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this editor? Their published stories stay online.")) return;
    setError("");
    const res = await fetch(`/api/editors/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not remove editor");
      return;
    }
    setEditors((list) => list.filter((e) => e.id !== id));
    if (editingId === id) reset();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editors"
        subtitle="Each editor signs in with their own account. Their photo appears on every story they write."
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Roster */}
        <Card className="overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">
              Roster
              <span className="ml-2 text-xs font-normal tabular-nums text-zinc-400">
                {editors.length}
              </span>
            </h2>
          </div>

          {editors.length === 0 ? (
            <EmptyState title="No editors yet" icon={<Icon.Users className="h-8 w-8" />} />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {editors.map((e) => {
                const isSelf = e.id === currentEditorId;
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50/70"
                  >
                    <EditorAvatar name={e.name} photoUrl={e.photoUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {e.name}
                        {isSelf && (
                          <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wider text-brand">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        @{e.username}
                        {e.title ? ` · ${e.title}` : ""}
                      </p>
                    </div>

                    <Badge tone={e.role === "admin" ? "brand" : "neutral"}>{e.role}</Badge>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(e)}
                        title="Edit editor"
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        <Icon.Pen className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(e.id)}
                        disabled={isSelf}
                        title={isSelf ? "You can't remove your own account" : "Remove editor"}
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                      >
                        <Icon.Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Add / edit form */}
        <Card className="sticky top-24 p-6">
          <form onSubmit={save} className="space-y-5">
            <h2 className="text-sm font-semibold text-zinc-900">
              {isNew ? "Add an editor" : `Edit ${draft.name || "editor"}`}
            </h2>

            <div className="flex items-center gap-4">
              <EditorAvatar
                name={draft.name || "New"}
                photoUrl={draft.photoUrl || undefined}
                size={52}
              />
              <div>
                <label className="cursor-pointer text-xs font-medium text-zinc-700 transition-colors hover:text-brand">
                  {uploading ? "Uploading…" : draft.photoUrl ? "Change photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadPhoto}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {draft.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, photoUrl: "" }))}
                    className="mt-0.5 block text-[11px] text-zinc-400 transition-colors hover:text-red-600"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            <Field
              label="Full name"
              value={draft.name}
              onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
              placeholder="Ama Boateng"
              required
            />
            <Field
              label="Username"
              value={draft.username}
              onChange={(v) => setDraft((d) => ({ ...d, username: v }))}
              placeholder="ama"
              required
            />
            <Field
              label={isNew ? "Password" : "New password"}
              hint={isNew ? undefined : "leave blank to keep current"}
              value={draft.password}
              onChange={(v) => setDraft((d) => ({ ...d, password: v }))}
              placeholder="At least 6 characters"
              type="password"
              required={isNew}
            />
            <Field
              label="Desk / title"
              hint="optional"
              value={draft.title}
              onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
              placeholder="Politics Desk"
            />

            <div>
              <label className={`mb-1.5 block ${microLabel}`}>
                Bio
                <span className="ml-1 font-normal normal-case tracking-normal text-zinc-400">
                  — optional, shown on their author page
                </span>
              </label>
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder="A sentence or two about this editor…"
                rows={3}
                maxLength={400}
                className={input}
              />
            </div>

            <div>
              <label className={`mb-1.5 block ${microLabel}`}>Role</label>
              <select
                value={draft.role}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, role: e.target.value as EditorRole }))
                }
                className={input}
              >
                <option value="editor">Editor — writes and manages their own stories</option>
                <option value="admin">Admin — manages editors and every story</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={busy || uploading}
                className={`${btnPrimary} flex-1`}
              >
                {busy ? "Saving…" : isNew ? "Add editor" : "Save changes"}
              </button>
              {!isNew && (
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={`mb-1.5 block ${microLabel}`}>
        {label}
        {hint && (
          <span className="ml-1 font-normal normal-case tracking-normal text-zinc-400">
            — {hint}
          </span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={input}
      />
    </div>
  );
}
