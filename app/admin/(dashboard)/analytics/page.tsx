import { getEditorStats } from "@/lib/store";
import { getCurrentEditor } from "@/lib/auth";
import EditorAvatar from "@/components/EditorAvatar";
import { Card, EmptyState, Icon, PageHeader, StatCard, microLabel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const stats = getEditorStats();
  const me = await getCurrentEditor();

  const newsroomViews = stats.reduce((sum, s) => sum + s.totalViews, 0);
  const newsroomPublished = stats.reduce((sum, s) => sum + s.published, 0);
  const topViews = stats[0]?.totalViews ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Editor performance"
        subtitle="Ranked by total views on published stories."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Editors"
          value={stats.length}
          icon={<Icon.Users className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Published stories"
          value={newsroomPublished}
          icon={<Icon.Articles className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Total views"
          value={newsroomViews.toLocaleString()}
          icon={<Icon.Trend className="h-[18px] w-[18px]" />}
        />
      </div>

      {stats.length === 0 ? (
        <Card>
          <EmptyState
            title="No editors yet"
            description="Add editors to see performance here."
            icon={<Icon.Users className="h-8 w-8" />}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">Leaderboard</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {stats.map((s, i) => {
              const isMe = me?.id === s.editor.id;
              const share =
                topViews > 0 ? Math.round((s.totalViews / topViews) * 100) : 0;

              return (
                <li
                  key={s.editor.id}
                  className={`flex flex-col gap-5 px-5 py-4 transition-colors sm:flex-row sm:items-center ${
                    isMe ? "bg-red-50/40" : "hover:bg-zinc-50/70"
                  }`}
                >
                  {/* Rank + identity */}
                  <div className="flex min-w-0 items-center gap-4 sm:w-64">
                    <span
                      className={`w-5 shrink-0 text-center text-sm tabular-nums ${
                        i === 0 ? "font-semibold text-zinc-900" : "text-zinc-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <EditorAvatar
                      name={s.editor.name}
                      photoUrl={s.editor.photoUrl}
                      size={40}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {s.editor.name}
                        {isMe && (
                          <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wider text-brand">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {s.editor.title ??
                          (s.editor.role === "admin" ? "Administrator" : "Editor")}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                    <Metric label="Views" value={s.totalViews.toLocaleString()} />
                    <Metric label="Published" value={s.published} />
                    <Metric label="Drafts" value={s.drafts} />
                    <Metric
                      label="Avg rating"
                      value={s.avgRating > 0 ? `${s.avgRating}` : "—"}
                    />
                  </div>

                  {/* Share of leader */}
                  <div className="shrink-0 sm:w-36">
                    <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] tabular-nums text-zinc-400">
                      {share}% of top editor
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className={microLabel}>{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-zinc-900">
        {value}
      </p>
    </div>
  );
}
