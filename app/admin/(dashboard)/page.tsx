import Link from "next/link";
import { getAll, countPendingComments, getSubscribers } from "@/lib/store";
import { CATEGORIES, categoryMeta } from "@/lib/types";
import { timeAgo } from "@/components/ArticleCard";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const all = getAll();
  const published = all.filter((a) => a.status === "published");
  const drafts = all.filter((a) => a.status === "draft");
  const breaking = published.filter((a) => a.isBreaking);
  const totalViews = all.reduce((sum, a) => sum + a.views, 0);
  const recent = all.slice(0, 6);
  const topStory = [...published].sort((a, b) => b.views - a.views)[0];

  const pendingComments = countPendingComments();
  const subscriberCount = getSubscribers().length;

  const stats: { label: string; value: string | number; accent: string; href?: string }[] = [
    { label: "Total Articles", value: all.length, accent: "#cc0000" },
    { label: "Published", value: published.length, accent: "#047857" },
    { label: "Drafts", value: drafts.length, accent: "#b45309" },
    { label: "Breaking Now", value: breaking.length, accent: "#1d4ed8" },
    { label: "Total Views", value: totalViews.toLocaleString(), accent: "#6d28d9" },
    {
      label: "Comments Pending",
      value: pendingComments,
      accent: "#d97706",
      href: "/admin/comments",
    },
    {
      label: "Subscribers",
      value: subscriberCount,
      accent: "#0e7490",
      href: "/admin/subscribers",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-black text-2xl">Dashboard</h1>
        <Link
          href="/admin/articles/new"
          className="bg-brand hover:bg-brand-dark text-white font-bold text-sm px-5 py-2.5 uppercase tracking-wider transition-colors"
        >
          + New Article
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((s) => {
          const card = (
            <div
              className="bg-white shadow-sm p-5 border-t-4 h-full hover:shadow-md transition-shadow"
              style={{ borderTopColor: s.accent }}
            >
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-1">
                {s.label}
              </p>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent articles */}
        <div className="lg:col-span-2 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-black text-sm uppercase tracking-wider">Recent Articles</h2>
            <Link href="/admin/articles" className="text-xs font-semibold text-brand hover:underline">
              Manage all →
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recent.map((a) => (
              <li key={a.id} className="px-6 py-3.5 flex items-center gap-4">
                <span
                  className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 shrink-0"
                  style={{ backgroundColor: categoryMeta(a.category).color }}
                >
                  {categoryMeta(a.category).label}
                </span>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="flex-1 min-w-0 font-semibold text-sm truncate hover:text-brand"
                >
                  {a.title}
                </Link>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    a.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {a.status}
                </span>
                <span className="text-xs text-neutral-400 shrink-0 w-16 text-right">
                  {timeAgo(a.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {topStory && (
            <div className="bg-white shadow-sm p-6">
              <h2 className="font-black text-sm uppercase tracking-wider mb-3">
                🔥 Top Story by Views
              </h2>
              <Link
                href={`/article/${topStory.slug}`}
                target="_blank"
                className="font-bold leading-snug hover:text-brand"
              >
                {topStory.title}
              </Link>
              <p className="text-sm text-neutral-500 mt-2">
                {topStory.views.toLocaleString()} views · {categoryMeta(topStory.category).label}
              </p>
            </div>
          )}

          <div className="bg-white shadow-sm p-6">
            <h2 className="font-black text-sm uppercase tracking-wider mb-4">
              Stories by Section
            </h2>
            <ul className="space-y-2.5">
              {CATEGORIES.map((c) => {
                const count = all.filter((a) => a.category === c.slug).length;
                const max = Math.max(1, ...CATEGORIES.map((cc) => all.filter((a) => a.category === cc.slug).length));
                return (
                  <li key={c.slug} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{c.label}</span>
                      <span className="text-neutral-500">{count}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(count / max) * 100}%`, backgroundColor: c.color }}
                      ></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
