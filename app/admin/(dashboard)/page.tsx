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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((s) => {
          const card = (
            <div
              className="admin-card p-6 border-l-4 h-full group hover:border-l-brand"
              style={{ borderLeftColor: s.accent }}
            >
              <p className="text-4xl font-black text-neutral-900">{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mt-2.5">
                {s.label}
              </p>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent articles */}
        <div className="lg:col-span-2 admin-card">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-black text-sm uppercase tracking-widest text-neutral-900">Recent Articles</h2>
            <Link href="/admin/articles" className="text-xs font-bold text-brand hover:text-brand-dark transition-colors">
              Manage all →
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recent.map((a) => (
              <li key={a.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                <span
                  className="text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-1 shrink-0 rounded"
                  style={{ backgroundColor: categoryMeta(a.category).color }}
                >
                  {categoryMeta(a.category).label}
                </span>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="flex-1 min-w-0 font-semibold text-sm truncate hover:text-brand transition-colors"
                >
                  {a.title}
                </Link>
                <span
                  className={`admin-badge shrink-0 ${
                    a.status === "published"
                      ? "admin-badge-success"
                      : "admin-badge-warning"
                  }`}
                >
                  {a.status}
                </span>
                <span className="text-xs text-neutral-400 shrink-0 w-16 text-right whitespace-nowrap">
                  {timeAgo(a.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {topStory && (
            <div className="admin-card p-6 border-l-4 border-l-brand">
              <h2 className="font-black text-sm uppercase tracking-widest text-neutral-900 mb-3">
                🔥 Top Story
              </h2>
              <Link
                href={`/article/${topStory.slug}`}
                target="_blank"
                className="font-bold leading-snug text-neutral-900 hover:text-brand transition-colors line-clamp-2"
              >
                {topStory.title}
              </Link>
              <p className="text-sm text-neutral-500 mt-3 flex items-center gap-2">
                <span className="inline-block">📊</span>
                {topStory.views.toLocaleString()} views
              </p>
            </div>
          )}

          <div className="admin-card p-6">
            <h2 className="font-black text-sm uppercase tracking-widest text-neutral-900 mb-4">
              Content by Section
            </h2>
            <ul className="space-y-3">
              {CATEGORIES.map((c) => {
                const count = all.filter((a) => a.category === c.slug).length;
                const max = Math.max(1, ...CATEGORIES.map((cc) => all.filter((a) => a.category === cc.slug).length));
                return (
                  <li key={c.slug} className="text-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-neutral-700">{c.label}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
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
