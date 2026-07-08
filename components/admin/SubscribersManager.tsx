"use client";

import { useState } from "react";
import { Subscriber } from "@/lib/types";

export default function SubscribersManager({ initial }: { initial: Subscriber[] }) {
  const [subs, setSubs] = useState<Subscriber[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(email: string) {
    if (!confirm(`Remove ${email} from the newsletter?`)) return;
    setBusy(email);
    try {
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (res.ok) setSubs((prev) => prev.filter((s) => s.email !== email));
    } finally {
      setBusy(null);
    }
  }

  function exportCsv() {
    const csv =
      "email,subscribed_at\n" +
      subs.map((s) => `${s.email},${s.createdAt}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gnn-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-black text-2xl">
          Newsletter Subscribers ({subs.length})
        </h1>
        <button
          onClick={exportCsv}
          disabled={subs.length === 0}
          className="bg-ink hover:bg-black disabled:opacity-40 text-white font-bold text-xs px-5 py-2.5 uppercase tracking-widest transition-colors"
        >
          ⬇ Export CSV
        </button>
      </div>

      {subs.length === 0 ? (
        <div className="bg-white shadow-sm px-6 py-16 text-center text-neutral-400">
          No subscribers yet. The signup form appears on the homepage, article pages
          and the Live page.
        </div>
      ) : (
        <div className="bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3">Email</th>
                <th className="px-3 py-3">Subscribed</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subs.map((s) => (
                <tr key={s.email} className={busy === s.email ? "opacity-50" : ""}>
                  <td className="px-5 py-3.5 font-semibold">{s.email}</td>
                  <td className="px-3 py-3.5 text-neutral-500">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      disabled={busy === s.email}
                      onClick={() => remove(s.email)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
