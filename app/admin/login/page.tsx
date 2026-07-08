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

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="bg-brand text-white font-black text-4xl px-3 py-1.5 leading-none inline-block">
            GNN
          </span>
          <p className="text-white/60 text-xs font-semibold tracking-[0.3em] uppercase mt-4">
            Newsroom Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-2xl p-8 space-y-5">
          <h1 className="font-black text-xl text-ink">Sign in to the newsroom</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full border border-neutral-300 px-4 py-2.5 focus:outline-none focus:border-brand"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-neutral-300 px-4 py-2.5 focus:outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-3 uppercase tracking-widest text-sm transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-xs text-neutral-400 text-center">
            Demo credentials: <code className="font-mono">admin / gnn2026</code>
          </p>
        </form>

        <p className="text-center mt-6">
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            ← Back to GNN.com
          </Link>
        </p>
      </div>
    </div>
  );
}
