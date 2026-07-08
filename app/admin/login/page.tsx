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
    <div className="min-h-screen bg-gradient-to-br from-neutral-dark via-neutral-dark to-brand/20 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative accent elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-secondary/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-brand to-brand-dark text-white font-black text-5xl px-4 py-2 leading-none">
              GNN
            </div>
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Ghana News Network</h2>
          <p className="text-white/60 text-sm font-semibold tracking-[0.15em] uppercase">
            Newsroom Admin Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-2xl p-8 space-y-6 rounded-lg">
          <div>
            <h1 className="font-black text-2xl text-neutral-dark mb-2">Sign In</h1>
            <p className="text-neutral-gray text-sm">Access the GNN newsroom</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-brand text-red-700 text-sm px-4 py-4 rounded">
              <p className="font-semibold">Login Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full border-2 border-neutral-300 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all rounded font-medium"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-brand mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-2 border-neutral-300 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all rounded font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand to-brand-dark hover:shadow-lg disabled:opacity-60 text-white font-black py-3 uppercase tracking-widest text-sm transition-all rounded"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div className="bg-neutral-50 p-4 rounded border border-neutral-200">
            <p className="text-xs text-neutral-500 font-medium">Demo Credentials:</p>
            <p className="text-sm font-bold text-neutral-dark mt-2">
              <span className="text-brand">username:</span> admin<br/>
              <span className="text-brand">password:</span> gnn2026
            </p>
          </div>
        </form>

        {/* Back Link */}
        <p className="text-center mt-8">
          <Link href="/" className="text-white/60 hover:text-white text-sm font-medium transition-colors">
            ← Back to GNN.com
          </Link>
        </p>
      </div>
    </div>
  );
}
