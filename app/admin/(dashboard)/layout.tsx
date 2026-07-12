import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/auth";
import { countPendingComments, getTrashed } from "@/lib/store";
import LogoutButton from "@/components/admin/LogoutButton";
import SidebarNav from "@/components/admin/SidebarNav";
import CommandPalette from "@/components/admin/CommandPalette";
import EditorAvatar from "@/components/EditorAvatar";
import { Icon } from "@/components/admin/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentEditor();
  if (!me) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <CommandPalette isAdmin={me.role === "admin"} />
      {/* Sidebar */}
      <aside className="sticky top-0 flex min-h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="flex h-16 items-center border-b border-zinc-800/80 px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="bg-brand px-2 py-1 text-lg font-bold leading-none tracking-tight text-white">
              GN
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Newsroom
            </span>
          </Link>
        </div>

        <SidebarNav
          isAdmin={me.role === "admin"}
          pendingComments={await countPendingComments()}
          trashedCount={(await getTrashed()).length}
        />

        <div className="space-y-1 border-t border-zinc-800/80 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-100"
          >
            <Icon.Globe className="h-[18px] w-[18px] text-zinc-500" />
            View live site
            <Icon.External className="ml-auto h-3.5 w-3.5 text-zinc-600" />
          </Link>
          <LogoutButton />
        </div>

        <Link
          href="/admin/account"
          className="flex items-center gap-3 border-t border-zinc-800/80 p-4 transition-colors hover:bg-zinc-900/60"
        >
          <EditorAvatar name={me.name} photoUrl={me.photoUrl} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{me.name}</p>
            <p className="text-xs text-zinc-500">
              {me.role === "admin" ? "Administrator" : me.title || "Editor"}
            </p>
          </div>
          <Icon.Pen className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-600" />
        </Link>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/85 px-8 backdrop-blur">
          <div>
            <p className="text-sm font-medium text-zinc-900">Newsroom Control Panel</p>
            <p className="text-xs text-zinc-500">Ghana Newspapers</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-400 sm:inline-flex">
              Search
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] font-medium text-zinc-500">
                ⌘K
              </kbd>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Signed in
            </span>
            <EditorAvatar name={me.name} photoUrl={me.photoUrl} size={32} />
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
