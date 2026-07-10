"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditorAvatar from "@/components/EditorAvatar";
import { EditorRole, PublicEditor } from "@/lib/types";

type Draft = {
  name: string;
  username: string;
  password: string;
  title: string;
  role: EditorRole;
  photoUrl: string;
};

const EMPTY: Draft = {
  name: "",
  username: "",
  password: "",
  title: "",
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
    <div className="space-y-8">
      <header>
        <h1 className="font-black text-3xl text-neutral-dark">Editors</h1>
        <p className="text-neutral-gray mt-1">
          Each editor signs in with their own account. Their photo appears on every
          story they write and on the performance board.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Roster */}
        <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
          {editors.length === 0 ? (
            <p className="p-6 text-neutral-gray">No editors yet.</p>
          ) : (
            editors.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-4">
                <EditorAvatar name={e.name} photoUrl={e.photoUrl} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-neutral-dark truncate">
                    {e.name}
                    {e.id === currentEditorId && (
                      <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-brand">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-gray truncate">
                    @{e.username}
                    {e.title ? ` · ${e.title}` : ""}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                    e.role === "admin"
                      ? "bg-brand/10 text-brand"
                      : "bg-neutral-100 text-neutral-gray"
                  }`}
                >
                  {e.role}
                </span>
                <button
                  onClick={() => startEdit(e)}
                  className="text-xs font-bold text-neutral-gray hover:text-brand px-2 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(e.id)}
                  disabled={e.id === currentEditorId}
                  title={
                    e.id === currentEditorId ? "You can't remove your own account" : "Remove"
                  }
                  className="text-xs font-bold text-neutral-gray hover:text-red-600 px-2 py-1 disabled:opacity-30 disabled:hover:text-neutral-gray"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add / edit form */}
        <form
          onSubmit={save}
          className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4 sticky top-6"
        >
          <h2 className="font-black text-lg text-neutral-dark">
            {isNew ? "Add an editor" : `Edit ${draft.name || "editor"}`}
          </h2>

          <div className="flex items-center gap-4">
            <EditorAvatar name={draft.name || "New"} photoUrl={draft.photoUrl || undefined} size={56} />
            <div>
              <label className="text-xs font-bold text-brand cursor-pointer hover:underline">
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
                  className="block text-[11px] text-neutral-gray hover:text-red-600 mt-0.5"
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
            label={isNew ? "Password" : "New password (leave blank to keep)"}
            value={draft.password}
            onChange={(v) => setDraft((d) => ({ ...d, password: v }))}
            placeholder="At least 6 characters"
            type="password"
            required={isNew}
          />
          <Field
            label="Desk / title (optional)"
            value={draft.title}
            onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
            placeholder="Politics Desk"
          />

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-gray mb-1">
              Role
            </label>
            <select
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as EditorRole }))}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="editor">Editor — writes and manages their own stories</option>
              <option value="admin">Admin — manages editors and every story</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={busy || uploading}
              className="flex-1 bg-brand text-white font-black text-sm py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? "Saving…" : isNew ? "Add editor" : "Save changes"}
            </button>
            {!isNew && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2.5 text-sm font-bold text-neutral-gray hover:text-neutral-dark"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-gray mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
      />
    </div>
  );
}
