import Link from "next/link";
import { getAll, countPendingComments, getSubscribers, getSections } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import { categoryMeta } from "@/lib/types";
import { timeAgo } from "@/components/ArticleCard";
import { ClearViewsButton } from "@/components/admin/ClearViewsButton";
import {
  Badge,
  Card,
  CardHeader,
  Icon,
  PageHeader,
  StatCard,
  btnPrimary,
  microLabel,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const all = await getAll();
  const CATEGORIES = await getSections();
  const published = all.filter((a) => a.status === "published");
  const drafts = all.filter((a) => a.status === "draft");
  const breaking = published.filter((a) => a.isBreaking);
  const totalViews = all.reduce((sum, a) => sum + a.views, 0);
  const recent = all.slice(0, 6);
  const topStory = [...published].sort((a, b) => b.views - a.views)[0];

  const pendingComments = await countPendingComments();
  const subscriberCount = (await getSubscribers()).length;
  const admin = await isAdmin();

  const rated = all.filter((a) => (a.rating ?? 0) > 0);
  const avgRating = rated.length
    ? rated.reduce((sum, a) => sum + a.rating, 0) / rated.length
    : 0;

  const iconClass = "h-[18px] w-[18px]";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Newsroom overview and editorial activity"
        action={
          <Link href="/admin/articles/new" className={btnPrimary}>
            <Icon.Plus className="h-4 w-4" />
            New article
          </Link>
        }
      />

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total articles"
          value={all.length}
          hint={`${published.length} published · ${drafts.length} drafts`}
          icon={<Icon.Articles className={iconClass} />}
        />
        <StatCard
          label="Total views"
          value={totalViews.toLocaleString()}
          hint="Across all published stories"
          icon={<Icon.Trend className={iconClass} />}
          footer={admin ? <ClearViewsButton /> : undefined}
        />
        <StatCard
          label="Comments pending"
          value={pendingComments}
          hint={pendingComments > 0 ? "Awaiting moderation" : "Queue is clear"}
          icon={<Icon.Comments className={iconClass} />}
          href="/admin/comments"
          emphasis={pendingComments > 0}
        />
        <StatCard
          label="Subscribers"
          value={subscriberCount}
          hint="Newsletter audience"
          icon={<Icon.Mail className={iconClass} />}
          href="/admin/subscribers"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Published" value={published.length} />
        <StatCard label="Drafts" value={drafts.length} />
        <StatCard
          label="Breaking now"
          value={breaking.length}
          icon={breaking.length > 0 ? <Icon.Alert className={iconClass} /> : undefined}
          emphasis={breaking.length > 0}
        />
        <StatCard
          label="Avg. rating"
          value={avgRating ? avgRating.toFixed(1) : "—"}
          hint={rated.length ? `${rated.length} rated stories` : "Nothing rated yet"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent articles */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent activity"
            action={
              <Link
                href="/admin/articles"
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-zinc-100">
            {recent.map((a) => {
              const meta = categoryMeta(a.category, CATEGORIES);
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50/70"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  />
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 transition-colors hover:text-brand"
                  >
                    {a.title}
                  </Link>
                  <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                    {meta.label}
                  </span>
                  <Badge tone={a.status === "published" ? "success" : "warning"}>
                    {a.status}
                  </Badge>
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-zinc-400">
                    {timeAgo(a.updatedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          {topStory && (
            <Card className="p-5">
              <p className={microLabel}>Top story</p>
              <Link
                href={`/article/${topStory.slug}`}
                target="_blank"
                className="mt-3 block text-sm font-medium leading-snug text-zinc-900 transition-colors hover:text-brand"
              >
                {topStory.title}
              </Link>
              <div className="mt-4 flex items-baseline gap-2 border-t border-zinc-100 pt-4">
                <span className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
                  {topStory.views.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500">views</span>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <p className={microLabel}>Distribution by section</p>
            <ul className="mt-4 space-y-3">
              {CATEGORIES.map((c) => {
                const count = all.filter((a) => a.category === c.slug).length;
                const max = Math.max(
                  1,
                  ...CATEGORIES.map(
                    (cc) => all.filter((a) => a.category === cc.slug).length
                  )
                );
                return (
                  <li key={c.slug}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="text-zinc-600">{c.label}</span>
                      <span className="text-xs font-medium tabular-nums text-zinc-500">
                        {count}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / max) * 100}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
