"use client";

import { useState, useMemo } from "react";
import { Subscriber } from "@/lib/types";

export default function SubscribersManager({ initial }: { initial: Subscriber[] }) {
  const [subs, setSubs] = useState<Subscriber[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "email">("date");

  const filtered = useMemo(() => {
    let result = [...subs];
    if (search) {
      result = result.filter((s) =>
        s.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sortBy === "email") {
      result.sort((a, b) => a.email.localeCompare(b.email));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [subs, search, sortBy]);

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
      filtered.map((s) => `${s.email},${s.createdAt}`).join("\n");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-2xl text-neutral-900">Newsletter Subscribers</h1>
          <p className="text-sm text-neutral-500">{filtered.length} subscriber{filtered.length !== 1 ? 's' : ''} {search && `matching "${search}"`}</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={subs.length === 0}
          className="admin-button text-xs px-5 py-2.5 bg-neutral-900 hover:bg-black text-white disabled:opacity-40 transition-colors"
        >
          ⬇ Export CSV
        </button>
      </div>

      {subs.length === 0 ? (
        <div className="admin-card px-6 py-16 text-center">
          <p className="text-lg text-neutral-400 mb-2">No subscribers yet</p>
          <p className="text-sm text-neutral-400">
            The signup form appears on the homepage, article pages, and the Live page.
          </p>
        </div>
      ) : (
        <>
          {/* Search and filters */}
          <div className="admin-card p-5 flex flex-col sm:flex-row flex-wrap gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email…"
              className="flex-1 min-w-48 border border-neutral-300 px-4 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 transition-all"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "email")}
              className="border border-neutral-300 px-3.5 py-2 text-sm bg-white rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 transition-all"
            >
              <option value="date">Newest first</option>
              <option value="email">A-Z by email</option>
            </select>
          </div>

          {/* Table */}
          <div className="admin-card overflow-hidden">
            <table className="admin-table w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-3 py-3">Subscribed</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr 
                    key={s.email} 
                    className={`hover:bg-neutral-50 transition-colors ${busy === s.email ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-neutral-900">{s.email}</td>
                    <td className="px-3 py-3.5 text-neutral-600 text-sm">
                      {new Date(s.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        disabled={busy === s.email}
                        onClick={() => remove(s.email)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
