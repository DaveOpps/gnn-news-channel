import Link from "next/link";
import { getSections } from "@/lib/store";

export default async function SiteHeader() {
  const CATEGORIES = await getSections();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="bg-ink text-white/70 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <span>{today}</span>
          <Link
            href="/admin"
            className="hover:text-white transition-colors hover:underline underline-offset-2"
          >
            Newsroom Login
          </Link>
        </div>
      </div>

      {/* Brand + nav */}
      <div className="bg-white border-b border-hairline-strong">
        <div className="max-w-7xl mx-auto px-4 h-[76px] flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <span className="bg-brand text-white font-black text-2xl tracking-tight px-2.5 py-1 leading-none">
              GN
            </span>
            <span className="hidden md:block text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-gray leading-tight">
              Ghana Newspapers
            </span>
          </Link>

          {/* Main navigation */}
          <nav className="flex-1 min-w-0 overflow-x-auto">
            <ul className="flex items-center gap-1 text-[13px] font-semibold text-neutral-gray">
              <li>
                <Link
                  href="/"
                  className="px-3 py-2 hover:text-brand transition-colors whitespace-nowrap"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/live"
                  className="flex items-center gap-1.5 px-3 py-2 text-brand transition-colors whitespace-nowrap"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand"></span>
                  </span>
                  Live
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="px-3 py-2 hover:text-brand transition-colors whitespace-nowrap"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/video"
                  className="px-3 py-2 hover:text-brand transition-colors whitespace-nowrap"
                >
                  Video
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="px-3 py-2 hover:text-brand transition-colors whitespace-nowrap"
                >
                  Resources
                </Link>
              </li>
            </ul>
          </nav>

          {/* Search */}
          <form action="/search" className="hidden lg:block shrink-0">
            <input
              type="search"
              name="q"
              placeholder="Search news…"
              className="border border-hairline-strong rounded-full px-4 py-2 text-sm w-44 focus:w-64 focus:outline-none focus:border-brand transition-all"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
