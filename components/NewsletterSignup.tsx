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
      setMessage({ ok: true, text: "You're in! Watch your inbox for Gh News briefings." });
      setEmail("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-ink text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-1.5 h-6 bg-brand"></span>
            <p className="text-white/50 text-xs font-semibold tracking-[0.2em] uppercase">
              Newsletter
            </p>
          </div>
          <h2 className="headline text-3xl md:text-4xl leading-tight">
            Get Ghana&apos;s top stories, every morning
          </h2>
          <p className="text-white/60 text-base mt-4">
            Never miss breaking news — the stories that matter, delivered
            straight to your inbox.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/50">
            <li>Daily news digest</li>
            <li>Breaking news alerts</li>
            <li>No spam, ever</li>
          </ul>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-3.5 text-sm focus:outline-none focus:border-brand transition-colors"
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-brand hover:bg-brand-dark disabled:opacity-60 font-semibold text-sm px-7 py-3.5 transition-colors shrink-0"
              >
                {sending ? "…" : "Subscribe"}
              </button>
            </div>
            {message && (
              <p
                className={`text-sm ${message.ok ? "text-emerald-300" : "text-red-300"}`}
              >
                {message.ok ? "✓ " : "✗ "}{message.text}
              </p>
            )}
          </form>
          <p className="text-white/35 text-xs mt-3">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
