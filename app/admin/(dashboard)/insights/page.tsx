import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/auth";
import {
  getViewsByDay,
  getTrendingByVelocity,
  getEngagementMap,
  getPublished,
} from "@/lib/store";
import { Card, CardHeader, EmptyState, Icon, PageHeader, StatCard, microLabel } from "@/components/admin/ui";
import { ViewsColumnChart, Sparkline, Meter, BarList } from "@/components/admin/charts";
import LiveReaders from "@/components/admin/LiveReaders";
import { compact, mmss } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");

  const days = await getViewsByDay(14);
  const trending = await getTrendingByVelocity(6, 6);
  const engagement = await getEngagementMap();
  const published = await getPublished();

  const last7 = days.slice(-7).reduce((s, d) => s + d.count, 0);
  const prev7 = days.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const weekChange = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

  const samples = Object.values(engagement).reduce((s, e) => s + e.samples, 0);
  const depthSum = Object.values(engagement).reduce((s, e) => s + e.depthSum, 0);
  const completed = Object.values(engagement).reduce((s, e) => s + e.completed, 0);
  const secondsSum = Object.values(engagement).reduce((s, e) => s + e.secondsSum, 0);

  const avgDepth = samples ? Math.round(depthSum / samples) : 0;
  const completionRate = samples ? Math.round((completed / samples) * 100) : 0;
  const avgSeconds = samples ? Math.round(secondsSum / samples) : 0;

  const rows = published
    .map((a) => {
      const e = engagement[a.id];
      return {
        article: a,
        samples: e?.samples ?? 0,
        depth: e?.samples ? Math.round(e.depthSum / e.samples) : 0,
        seconds: e?.samples ? Math.round(e.secondsSum / e.samples) : 0,
        completion: e?.samples ? Math.round((e.completed / e.samples) * 100) : 0,
      };
    })
    .filter((r) => r.samples > 0)
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 10);

  const th = `px-4 py-3 text-left ${microLabel}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audience insights"
        subtitle="Traffic, momentum and how far readers actually get."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <LiveReaders />

        <StatCard
          label="Views, last 7 days"
          value={compact(last7)}
          hint={
            weekChange === null
              ? "No prior week to compare"
              : `${weekChange >= 0 ? "+" : ""}${weekChange}% vs previous 7 days`
          }
          icon={<Icon.Trend className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Avg. scroll depth"
          value={samples ? `${avgDepth}%` : "—"}
          hint={samples ? `${samples.toLocaleString()} reader sessions` : "No data yet"}
        />
        <StatCard
          label="Read completion"
          value={samples ? `${completionRate}%` : "—"}
          hint={samples ? `Avg. ${mmss(avgSeconds)} on page` : "Reaches 90% of the story"}
        />
      </div>

      {/* Views over time */}
      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Views over time</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Every story view, bucketed by day
            </p>
          </div>
          <Sparkline points={days.map((d) => d.count)} />
        </div>
        <ViewsColumnChart data={days} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trending by velocity */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Trending now</h2>
          <p className="mb-4 mt-0.5 text-xs text-zinc-400">
            Views in the last 6 hours — what is accelerating, not what is merely big
          </p>
          {trending.length === 0 ? (
            <EmptyState
              title="Nothing trending yet"
              description="Momentum appears once stories start being read."
              icon={<Icon.Trend className="h-8 w-8" />}
            />
          ) : (
            <BarList
              items={trending.map((t) => ({
                id: t.article.id,
                label: t.article.title,
                value: t.recent,
                hint:
                  t.change === null
                    ? "new"
                    : `${t.change >= 0 ? "▲" : "▼"}${Math.abs(Math.round(t.change))}%`,
              }))}
            />
          )}
        </Card>

        {/* Engagement */}
        <Card className="overflow-hidden">
          <CardHeader title="How far readers get" />
          {rows.length === 0 ? (
            <EmptyState
              title="No engagement data yet"
              description="Depth is measured as readers leave a story."
              icon={<Icon.Eye className="h-8 w-8" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70">
                    <th className={th}>Story</th>
                    <th className={th}>Depth</th>
                    <th className={`${th} text-right`}>Finish</th>
                    <th className={`${th} text-right`}>Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r) => (
                    <tr key={r.article.id} className="hover:bg-zinc-50/70">
                      <td className="max-w-[14rem] px-4 py-3">
                        <Link
                          href={`/admin/articles/${r.article.id}`}
                          className="line-clamp-1 text-sm text-zinc-800 transition-colors hover:text-brand"
                        >
                          {r.article.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Meter value={r.depth} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                        {r.completion}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-zinc-600">
                        {mmss(r.seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
