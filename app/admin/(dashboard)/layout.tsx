import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-neutral-dark to-neutral-dark border-r-4 border-brand text-white flex flex-col shrink-0 min-h-screen sticky top-0">
        {/* Logo Section */}
        <div className="p-6 border-b-2 border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-brand to-brand-dark text-white font-black text-2xl px-2.5 py-1 leading-none">
              GNN
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-accent">Admin</span>
              <span className="text-[8px] font-bold text-white/60">Newsroom</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 text-sm font-semibold">
          <Link
            href="/admin"
            className="block px-4 py-3 rounded-lg hover:bg-white/10 hover:text-brand-accent transition-all duration-200 border-l-3 border-transparent hover:border-brand-accent"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/admin/articles"
            className="block px-4 py-3 rounded-lg hover:bg-white/10 hover:text-brand-accent transition-all duration-200 border-l-3 border-transparent hover:border-brand-accent"
          >
            📰 Articles
          </Link>
          <Link
            href="/admin/articles/new"
            className="block px-4 py-3 rounded-lg bg-brand/20 text-brand-accent font-bold border-l-3 border-brand-accent transition-all duration-200"
          >
            ✏️ New Article
          </Link>
          <Link
            href="/admin/comments"
            className="block px-4 py-3 rounded-lg hover:bg-white/10 hover:text-brand-accent transition-all duration-200 border-l-3 border-transparent hover:border-brand-accent"
          >
            💬 Comments
          </Link>
          <Link
            href="/admin/subscribers"
            className="block px-4 py-3 rounded-lg hover:bg-white/10 hover:text-brand-accent transition-all duration-200 border-l-3 border-transparent hover:border-brand-accent"
          >
            📧 Subscribers
          </Link>
        </nav>

        {/* View Site Link */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            className="block px-4 py-3 rounded-lg hover:bg-brand/20 text-white/70 hover:text-brand-accent transition-all duration-200 font-semibold text-center border border-brand/30"
          >
            🌐 View Live Site
          </Link>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b-2 border-neutral-200 px-8 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-neutral-dark">GNN Newsroom Control Panel</h1>
            <p className="text-xs text-neutral-gray mt-0.5">Manage Ghana news coverage</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Editor Active
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-8 bg-background">{children}</main>
      </div>
    </div>
  );
}
