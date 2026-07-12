import Link from "next/link";
import { getActivity, getById } from "@/lib/store";
import { ACTIVITY_LABELS, ActivityAction } from "@/lib/types";
import { timeAgo } from "@/components/ArticleCard";
import { Card, EmptyState, Icon, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/** A dot colour per action family, so the feed scans at a glance. */
function toneFor(action: ActivityAction): string {
  if (action.endsWith("published") && !action.includes("un")) return "bg-emerald-500";
  if (action === "article.unpublished") return "bg-amber-500";
  if (action === "article.scheduled") return "bg-blue-500";
  if (action === "article.trashed") return "bg-orange-500";
  if (action === "article.purged") return "bg-red-600";
  if (action === "article.restored") return "bg-emerald-500";
  if (action.startsWith("editor.")) return "bg-violet-500";
  if (action.startsWith("comment.")) return "bg-sky-500";
  return "bg-zinc-300";
}

export default async function AdminActivityPage() {
  const events = await getActivity(150);
  const targetIds = [...new Set(events.map((e) => e.targetId).filter((id): id is string => Boolean(id)))];
  const articles = new Map(
    (await Promise.all(targetIds.map(async (id) => [id, await getById(id)] as const)))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        subtitle="Every publish, edit and deletion in the newsroom, newest first."
      />

      <Card className="overflow-hidden">
        {events.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Publish or edit a story and it will show up here."
            icon={<Icon.Chart className="h-8 w-8" />}
          />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {events.map((e) => {
              const article = e.targetId ? articles.get(e.targetId) : undefined;
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50/70"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneFor(e.action)}`}
                    aria-hidden
                  />
                  <p className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                    <span className="font-medium text-zinc-900">{e.editorName}</span>{" "}
                    {ACTIVITY_LABELS[e.action]}{" "}
                    {article && !article.deletedAt ? (
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="font-medium text-zinc-900 transition-colors hover:text-brand"
                      >
                        {e.target}
                      </Link>
                    ) : (
                      <span className="font-medium text-zinc-900">{e.target}</span>
                    )}
                    {e.detail && (
                      <span className="text-zinc-400"> — {e.detail}</span>
                    )}
                  </p>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                    {timeAgo(e.at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
