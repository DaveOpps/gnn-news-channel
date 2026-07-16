"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import SidebarNav from "./SidebarNav";
import CommandPalette from "./CommandPalette";
import EditorAvatar from "@/components/EditorAvatar";
import { Icon } from "./ui";
import { PublicEditor } from "@/lib/types";

export default function AdminShell({
  me,
  pendingComments,
  trashedCount,
  children,
}: {
  me: PublicEditor;
  pendingComments: number;
  trashedCount: number;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // A route change means the user picked something from the drawer — close it.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <CommandPalette isAdmin={me.role === "admin"} />

      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 lg:sticky lg:top-0 lg:min-h-screen lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="bg-brand px-2 py-1 text-lg font-bold leading-none tracking-tight text-white">
              GN
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Newsroom
            </span>
          </Link>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 lg:hidden"
          >
            <Icon.X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav
          isAdmin={me.role === "admin"}
          pendingComments={pendingComments}
          trashedCount={trashedCount}
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/85 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 lg:hidden"
            >
              <Icon.Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-medium text-zinc-900">Newsroom Control Panel</p>
              <p className="hidden text-xs text-zinc-500 sm:block">Ghana Newspapers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-400 sm:inline-flex">
              Search
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] font-medium text-zinc-500">
                ⌘K
              </kbd>
            </span>
            <span className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Signed in
            </span>
            <EditorAvatar name={me.name} photoUrl={me.photoUrl} size={32} />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
