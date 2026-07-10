import { getEditorStats } from "@/lib/store";
import { getCurrentEditor } from "@/lib/auth";
import EditorAvatar from "@/components/EditorAvatar";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function AdminAnalyticsPage() {
  const stats = getEditorStats();
  const me = await getCurrentEditor();

  const newsroomViews = stats.reduce((sum, s) => sum + s.totalViews, 0);
  const newsroomPublished = stats.reduce((sum, s) => sum + s.published, 0);
  const topViews = stats[0]?.totalViews ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-black text-3xl text-neutral-dark">Editor Performance</h1>
        <p className="text-neutral-gray mt-1">
          How every editor in the newsroom is performing. Ranked by total views on
          published stories.
        </p>
      </header>

      {/* Newsroom totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Editors", value: stats.length },
          { label: "Published stories", value: newsroomPublished },
          { label: "Total views", value: newsroomViews.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-gray">
              {s.label}
            </p>
            <p className="font-black text-3xl text-neutral-dark mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      {stats.length === 0 ? (
        <p className="text-neutral-gray">No editors yet.</p>
      ) : (
        <div className="space-y-3">
          {stats.map((s, i) => {
            const isMe = me?.id === s.editor.id;
            const share = topViews > 0 ? Math.round((s.totalViews / topViews) * 100) : 0;

            return (
              <div
                key={s.editor.id}
                className={`bg-white rounded-lg border p-5 flex flex-col sm:flex-row sm:items-center gap-5 ${
                  isMe ? "border-brand ring-1 ring-brand/30" : "border-neutral-200"
                }`}
              >
                {/* Rank + identity */}
                <div className="flex items-center gap-4 min-w-0 sm:w-72">
                  <span className="font-black text-lg text-neutral-gray w-8 text-center shrink-0">
                    {MEDALS[i] ?? i + 1}
                  </span>
                  <EditorAvatar
                    name={s.editor.name}
                    photoUrl={s.editor.photoUrl}
                    size={52}
                  />
                  <div className="min-w-0">
                    <p className="font-black text-neutral-dark truncate">
                      {s.editor.name}
                      {isMe && (
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-brand">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-gray truncate">
                      {s.editor.title ?? (s.editor.role === "admin" ? "Admin" : "Editor")}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                  <Metric label="Views" value={s.totalViews.toLocaleString()} />
                  <Metric label="Published" value={s.published} />
                  <Metric label="Drafts" value={s.drafts} />
                  <Metric
                    label="Avg rating"
                    value={s.avgRating > 0 ? `${s.avgRating} ★` : "—"}
                  />
                </div>

                {/* Share of the leader's views */}
                <div className="sm:w-40 shrink-0">
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand to-brand-dark rounded-full"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-gray mt-1.5">
                    {share}% of top editor
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-gray">
        {label}
      </p>
      <p className="font-black text-xl text-neutral-dark">{value}</p>
    </div>
  );
}
