"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-shadow focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-[380px]">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <span className="inline-block bg-brand px-2.5 py-1 text-2xl font-bold leading-none tracking-tight text-white">
            GH
          </span>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Newsroom Admin
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-7 shadow-xl"
        >
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Access the Gh News newsroom.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.09em] text-zinc-500"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="admin"
                className={field}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.09em] text-zinc-500"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={field}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-6 rounded-lg border border-zinc-100 bg-zinc-50 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-zinc-400">
              Demo credentials
            </p>
            <p className="mt-1.5 font-mono text-xs text-zinc-600">
              admin&nbsp;&nbsp;/&nbsp;&nbsp;gnn2026
            </p>
          </div>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Back to Gh News
          </Link>
        </p>
      </div>
    </div>
  );
}
