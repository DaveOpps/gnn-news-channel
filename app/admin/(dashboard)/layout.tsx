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
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-ink text-white flex flex-col shrink-0 min-h-screen sticky top-0">
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="bg-brand text-white font-black text-xl px-2 py-0.5 leading-none">
              GNN
            </span>
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/60">
              Newsroom
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 text-sm font-semibold">
          <Link
            href="/admin"
            className="block px-3 py-2.5 rounded hover:bg-white/10 transition-colors"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/admin/articles"
            className="block px-3 py-2.5 rounded hover:bg-white/10 transition-colors"
          >
            📰 Articles
          </Link>
          <Link
            href="/admin/articles/new"
            className="block px-3 py-2.5 rounded hover:bg-white/10 transition-colors"
          >
            ✏️ New Article
          </Link>
          <Link
            href="/admin/comments"
            className="block px-3 py-2.5 rounded hover:bg-white/10 transition-colors"
          >
            💬 Comments
          </Link>
          <Link
            href="/admin/subscribers"
            className="block px-3 py-2.5 rounded hover:bg-white/10 transition-colors"
          >
            📧 Subscribers
          </Link>
          <Link
            href="/"
            target="_blank"
            className="block px-3 py-2.5 rounded hover:bg-white/10 transition-colors text-white/70"
          >
            🌐 View Site ↗
          </Link>
        </nav>

        <div className="p-3 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-neutral-200 px-8 h-14 flex items-center justify-between sticky top-0 z-10">
          <span className="text-sm font-semibold text-neutral-500">
            GNN Newsroom Control Panel
          </span>
          <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
            ● Editor signed in
          </span>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
