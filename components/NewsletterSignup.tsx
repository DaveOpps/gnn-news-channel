"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSending(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Subscription failed" });
        return;
      }
      setMessage({ ok: true, text: "You're in! Watch your inbox for GNN briefings." });
      setEmail("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-brand font-black text-xs tracking-[0.3em] uppercase mb-2">
            The GNN Briefing
          </p>
          <h2 className="font-black text-2xl md:text-3xl leading-tight">
            The day&apos;s biggest stories, in your inbox before breakfast.
          </h2>
          <p className="text-white/60 text-sm mt-2">
            Free daily newsletter. No spam, unsubscribe anytime.
          </p>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-3.5 text-sm focus:outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-brand hover:bg-brand-dark disabled:opacity-60 font-bold text-xs px-6 py-3.5 uppercase tracking-widest transition-colors shrink-0"
            >
              {sending ? "…" : "Subscribe"}
            </button>
          </form>
          {message && (
            <p
              className={`text-sm mt-3 ${message.ok ? "text-green-400" : "text-red-400"}`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
