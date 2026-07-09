"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const navLink = (href: string, icon: string, label: string) => (
    <Link
      href={href}
      className={`admin-nav-link font-semibold text-sm ${isActive(href) ? "active" : ""}`}
    >
      <span className="inline-block w-5">{icon}</span> {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside style={{ backgroundColor: "var(--admin-sidebar-bg)" }} className="w-64 text-white flex flex-col shrink-0 min-h-screen sticky top-0 border-r border-neutral-200">
        <div className="p-6 border-b" style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="bg-brand text-white font-black text-lg px-2.5 py-0.5 leading-none rounded">
              GNN
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wider leading-tight">
                NEWSROOM
              </span>
              <span className="text-[10px] text-white/60 tracking-wider">
                Control Panel
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 text-sm overflow-y-auto">
          <div className="mb-2">
            <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
              Main
            </p>
            <div className="space-y-0.5 mt-1">
              {navLink("/admin", "📊", "Dashboard")}
            </div>
          </div>

          <div className="mb-2">
            <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
              Content
            </p>
            <div className="space-y-0.5 mt-1">
              {navLink("/admin/articles", "📰", "Articles")}
              {navLink("/admin/articles/new", "✏️", "New Article")}
            </div>
          </div>

          <div className="mb-2">
            <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/60">
              Moderation
            </p>
            <div className="space-y-0.5 mt-1">
              {navLink("/admin/comments", "💬", "Comments")}
              {navLink("/admin/subscribers", "📧", "Subscribers")}
            </div>
          </div>

          <div className="mt-6 pt-4" style={{ borderTopColor: "rgba(255, 255, 255, 0.1)", borderTopWidth: "1px" }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-nav-link font-semibold text-sm text-white/80 hover:text-white"
            >
              <span className="inline-block w-5">🌐</span> View Site
            </a>
          </div>
        </nav>

        <div className="p-4 border-t" style={{ borderTopColor: "rgba(255, 255, 255, 0.1)" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-neutral-200 px-8 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-bold text-sm uppercase tracking-wider text-neutral-500">
              GNN Newsroom
            </h1>
            <p className="text-xs text-neutral-400">Content Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
              <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
              Editor Active
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
