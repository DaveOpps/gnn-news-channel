import Link from "next/link";
import { getSections } from "@/lib/store";

export default function SiteHeader() {
  const CATEGORIES = getSections();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-50 shadow-lg">
      {/* Top utility bar - Dark with accent color */}
      <div className="bg-neutral-dark text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <span className="text-white/70 font-medium">{today}</span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/70">
              Live TV · Audio · Newsletters
            </span>
            <Link
              href="/admin"
              className="text-white/60 hover:text-white transition-colors hover:underline"
            >
              Newsroom Login
            </Link>
          </div>
        </div>
      </div>

      {/* Brand + nav - Bold styling */}
      <div className="bg-neutral-light border-b-4 border-brand">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-brand to-brand-dark text-white font-black text-3xl tracking-tight px-3 py-1.5 leading-none">
                GNN
              </span>
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-brand mt-0.5">
                Ghana News Network
              </span>
            </div>
          </Link>

          {/* Main navigation */}
          <nav className="flex-1 overflow-x-auto">
            <ul className="flex items-center gap-0.5 text-sm font-bold">
              <li>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-none hover:bg-neutral-100 hover:text-brand transition-colors whitespace-nowrap relative"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/live"
                  className="flex items-center gap-2 px-4 py-2 rounded-none hover:bg-neutral-100 text-brand font-black transition-colors whitespace-nowrap"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse"></span>
                  Live
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="px-4 py-2 rounded-none hover:bg-neutral-100 hover:text-brand transition-colors whitespace-nowrap"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/video"
                  className="px-4 py-2 rounded-none hover:bg-neutral-100 hover:text-brand transition-colors whitespace-nowrap"
                >
                  Video
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="px-4 py-2 rounded-none hover:bg-neutral-100 hover:text-brand transition-colors whitespace-nowrap"
                >
                  Resources
                </Link>
              </li>
            </ul>
          </nav>

          {/* Search bar */}
          <form action="/search" className="hidden lg:block shrink-0">
            <input
              type="search"
              name="q"
              placeholder="Search news…"
              className="border-2 border-neutral-300 rounded px-4 py-2 text-sm w-48 focus:w-64 focus:outline-none focus:border-brand transition-all font-medium"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
