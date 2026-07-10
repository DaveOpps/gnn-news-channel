"use client";

import { useState } from "react";
import { Subscriber } from "@/lib/types";
import { Card, EmptyState, Icon, PageHeader, btnSecondary, microLabel } from "./ui";

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

  const th = `px-4 py-3 text-left ${microLabel}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscribers"
        subtitle={`${subs.length} ${subs.length === 1 ? "person" : "people"} on the newsletter`}
        action={
          <button onClick={exportCsv} disabled={subs.length === 0} className={btnSecondary}>
            <Icon.Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <Card className="overflow-hidden">
        {subs.length === 0 ? (
          <EmptyState
            title="No subscribers yet"
            description="The signup form appears on the homepage, article pages and the Live page."
            icon={<Icon.Mail className="h-8 w-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70">
                  <th className={th}>Email</th>
                  <th className={th}>Subscribed</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {subs.map((s) => (
                  <tr
                    key={s.email}
                    className={`transition-colors hover:bg-zinc-50/70 ${
                      busy === s.email ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5 text-sm font-medium text-zinc-900">
                      {s.email}
                    </td>
                    <td className="px-4 py-3.5 text-sm tabular-nums text-zinc-500">
                      {new Date(s.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        disabled={busy === s.email}
                        onClick={() => remove(s.email)}
                        title="Remove subscriber"
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Icon.Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
