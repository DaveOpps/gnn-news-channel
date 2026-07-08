import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

export default function SiteHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top utility bar */}
      <div className="bg-ink text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <span className="text-white/70">{today}</span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/70">
              Live TV · Audio · Newsletters
            </span>
            <Link
              href="/admin"
              className="text-white/60 hover:text-white transition-colors"
            >
              Newsroom Login
            </Link>
          </div>
        </div>
      </div>

      {/* Brand + nav */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="bg-brand text-white font-black text-2xl tracking-tight px-2.5 py-1 leading-none">
              GNN
            </span>
            <span className="hidden md:block text-[10px] font-semibold tracking-[0.25em] uppercase text-neutral-500 leading-tight">
              Global News
              <br />
              Network
            </span>
          </Link>

          <nav className="flex-1 overflow-x-auto">
            <ul className="flex items-center gap-1 text-sm font-semibold">
              <li>
                <Link
                  href="/"
                  className="px-3 py-2 rounded hover:bg-neutral-100 hover:text-brand transition-colors whitespace-nowrap"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/live"
                  className="flex items-center gap-1.5 px-3 py-2 rounded hover:bg-neutral-100 text-brand transition-colors whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                  Live
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="px-3 py-2 rounded hover:bg-neutral-100 hover:text-brand transition-colors whitespace-nowrap"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <form action="/search" className="hidden lg:block shrink-0">
            <input
              type="search"
              name="q"
              placeholder="Search news…"
              className="border border-neutral-300 rounded-full px-4 py-1.5 text-sm w-48 focus:w-64 focus:outline-none focus:border-brand transition-all"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
