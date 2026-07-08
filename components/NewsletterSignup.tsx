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
    <section className="bg-gradient-to-r from-neutral-dark to-neutral-dark text-white border-t-4 border-brand-accent">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-8 bg-brand-accent"></span>
            <p className="text-brand-accent font-black text-xs tracking-[0.3em] uppercase">
              📰 Newsletter
            </p>
          </div>
          <h2 className="font-black text-3xl md:text-4xl leading-tight text-neutral-light">
            Get Ghana&apos;s Top Stories Daily
          </h2>
          <p className="text-white/70 text-base mt-4 font-medium">
            Never miss breaking news. Get the most important stories delivered straight to your inbox every morning.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/60">
            <li>✓ Daily news digest</li>
            <li>✓ Breaking news alerts</li>
            <li>✓ No spam, ever</li>
          </ul>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="flex-1 bg-white/10 border-2 border-white/20 text-white placeholder:text-white/50 px-5 py-4 text-sm focus:outline-none focus:border-brand-accent transition-colors font-medium"
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-brand hover:bg-brand-dark disabled:opacity-60 font-black text-xs px-8 py-4 uppercase tracking-widest transition-colors shrink-0 shadow-lg hover:shadow-xl"
              >
                {sending ? "…" : "Subscribe"}
              </button>
            </div>
            {message && (
              <p
                className={`text-sm font-semibold ${message.ok ? "text-green-300" : "text-red-300"}`}
              >
                {message.ok ? "✓ " : "✗ "}{message.text}
              </p>
            )}
          </form>
          <p className="text-white/40 text-xs mt-4 font-medium">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
