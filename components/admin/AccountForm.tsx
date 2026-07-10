"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditorAvatar from "@/components/EditorAvatar";
import { PublicEditor } from "@/lib/types";
import { Badge, Card, Icon, PageHeader, btnPrimary, btnSecondary, input, microLabel } from "./ui";

export default function AccountForm({ me }: { me: PublicEditor }) {
  const router = useRouter();

  const [name, setName] = useState(me.name);
  const [title, setTitle] = useState(me.title ?? "");
  const [photoUrl, setPhotoUrl] = useState(me.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Photo upload failed" });
        return;
      }
      setPhotoUrl(data.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/editors/${me.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, photoUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not save your profile" });
        return;
      }
      setMessage({ ok: true, text: "Profile updated." });
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ ok: false, text: "Your new password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ ok: false, text: "The two new passwords don't match." });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`/api/editors/${me.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not change your password" });
        return;
      }
      setMessage({ ok: true, text: "Password changed." });
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
    } finally {
      setSavingPassword(false);
    }
  }

  const label = `mb-1.5 block ${microLabel}`;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My account" subtitle="Your byline, photo and password." />

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

      {/* Profile */}
      <Card className="p-6">
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Profile</h2>
            <Badge tone={me.role === "admin" ? "brand" : "neutral"}>{me.role}</Badge>
          </div>

          <div className="flex items-center gap-4">
            <EditorAvatar name={name || me.name} photoUrl={photoUrl || undefined} size={56} />
            <div className="flex items-center gap-3">
              <label className={`${btnSecondary} cursor-pointer ${uploading ? "opacity-60" : ""}`}>
                <Icon.Image className="h-4 w-4" />
                {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadPhoto}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="text-xs text-zinc-400 transition-colors hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={label}>Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={input}
              />
              <p className="mt-1 text-xs text-zinc-400">This is your byline on every story.</p>
            </div>
            <div>
              <label className={label}>Desk / title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Politics Desk"
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={label}>Username</label>
            <input value={me.username} disabled className={`${input} bg-zinc-50 text-zinc-500`} />
            <p className="mt-1 text-xs text-zinc-400">
              Ask an admin if your sign-in name needs to change.
            </p>
          </div>

          <button type="submit" disabled={savingProfile} className={btnPrimary}>
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      </Card>

      {/* Password */}
      <Card className="p-6">
        <form onSubmit={savePassword} className="space-y-5">
          <h2 className="text-sm font-semibold text-zinc-900">Change password</h2>

          <div>
            <label className={label}>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${input} max-w-sm`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={label}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className={input}
              />
            </div>
          </div>

          <button type="submit" disabled={savingPassword} className={btnPrimary}>
            {savingPassword ? "Changing…" : "Change password"}
          </button>
        </form>
      </Card>
    </div>
  );
}
