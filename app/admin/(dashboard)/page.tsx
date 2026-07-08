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

  const rated = all.filter((a) => (a.rating ?? 0) > 0);
  const avgRating = rated.length
    ? rated.reduce((sum, a) => sum + a.rating, 0) / rated.length
    : 0;

  const stats: { label: string; value: string | number; accent: string; href?: string }[] = [
    { label: "Total Articles", value: all.length, accent: "#d92e1d" },
    { label: "Published", value: published.length, accent: "#047857" },
    { label: "Drafts", value: drafts.length, accent: "#b45309" },
    { label: "Breaking Now", value: breaking.length, accent: "#0052a3" },
    { label: "Total Views", value: totalViews.toLocaleString(), accent: "#ffa500" },
    {
      label: "Comments Pending",
      value: pendingComments,
      accent: "#d92e1d",
      href: "/admin/comments",
    },
    {
      label: "Subscribers",
      value: subscriberCount,
      accent: "#0052a3",
      href: "/admin/subscribers",
    },
    {
      label: "Avg. Rating",
      value: avgRating ? `${avgRating.toFixed(1)}★` : "—",
      accent: "#f59e0b",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-3xl text-neutral-dark">Dashboard</h1>
          <p className="text-neutral-gray text-sm mt-1">Your newsroom overview and control center</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-gradient-to-r from-brand to-brand-dark hover:shadow-lg text-white font-black text-sm px-6 py-3 uppercase tracking-widest transition-all shadow-md"
        >
          + Create Article
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats.map((s) => {
          const card = (
            <div
              className="bg-white shadow-md p-6 border-l-4 h-full hover:shadow-lg transition-all duration-300 rounded"
              style={{ borderLeftColor: s.accent }}
            >
              <p className="text-4xl font-black text-neutral-dark">{s.value}</p>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-neutral-gray mt-2">
                {s.label}
              </p>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block hover:scale-105 transition-transform">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent articles */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-brand to-brand-dark border-b-2 border-brand-accent flex items-center justify-between">
            <h2 className="font-black text-sm uppercase tracking-[0.1em] text-white">Recent Articles</h2>
            <Link href="/admin/articles" className="text-xs font-bold text-brand-accent hover:underline">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {recent.map((a) => (
              <li key={a.id} className="px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                <span
                  className="text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-1 shrink-0 rounded"
                  style={{ backgroundColor: categoryMeta(a.category).color }}
                >
                  {categoryMeta(a.category).label}
                </span>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="flex-1 min-w-0 font-bold text-sm truncate hover:text-brand transition-colors"
                >
                  {a.title}
                </Link>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${
                    a.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {a.status}
                </span>
                <span className="text-xs text-neutral-400 shrink-0 w-16 text-right font-medium">
                  {timeAgo(a.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-8">
          {topStory && (
            <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-brand">
              <h2 className="font-black text-sm uppercase tracking-[0.1em] text-neutral-dark mb-4">
                🔥 Top Story
              </h2>
              <Link
                href={`/article/${topStory.slug}`}
                target="_blank"
                className="font-bold leading-snug hover:text-brand transition-colors"
              >
                {topStory.title}
              </Link>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200">
                <span className="text-2xl font-black text-brand">{topStory.views.toLocaleString()}</span>
                <span className="text-xs text-neutral-500 font-medium">views</span>
              </div>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-brand-secondary">
            <h2 className="font-black text-sm uppercase tracking-[0.1em] text-neutral-dark mb-4">
              Distribution by Section
            </h2>
            <ul className="space-y-3">
              {CATEGORIES.map((c) => {
                const count = all.filter((a) => a.category === c.slug).length;
                const max = Math.max(1, ...CATEGORIES.map((cc) => all.filter((a) => a.category === cc.slug).length));
                return (
                  <li key={c.slug} className="text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-neutral-dark">{c.label}</span>
                      <span className="font-black text-brand">{count}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
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
