import Link from "next/link";
import { getSections } from "@/lib/store";

export default function SiteFooter() {
  const CATEGORIES = getSections();
  return (
    <footer className="bg-ink text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        <div className="col-span-2 lg:col-span-1">
          <span className="bg-brand text-white font-black text-2xl px-2.5 py-1 leading-none inline-block">
            GNN
          </span>
          <p className="text-white/50 text-sm mt-4 leading-relaxed">
            Ghana&apos;s digital news source — breaking news, politics, business,
            sports and entertainment coverage, all day.
          </p>
          <div className="flex gap-2.5 mt-5">
            <a href="#" aria-label="Facebook" className="w-8 h-8 bg-white/10 hover:bg-brand rounded-full flex items-center justify-center transition-colors text-xs">f</a>
            <a href="#" aria-label="X" className="w-8 h-8 bg-white/10 hover:bg-brand rounded-full flex items-center justify-center transition-colors text-xs">𝕏</a>
            <a href="#" aria-label="LinkedIn" className="w-8 h-8 bg-white/10 hover:bg-brand rounded-full flex items-center justify-center transition-colors text-xs">in</a>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-5">
            News
          </h4>
          <ul className="space-y-2.5 text-sm">
            {CATEGORIES.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/65 hover:text-white transition-colors">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-5">
            More
          </h4>
          <ul className="space-y-2.5 text-sm">
            {CATEGORIES.slice(4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/65 hover:text-white transition-colors">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-5">
            Watch &amp; Explore
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/video" className="text-white/65 hover:text-white transition-colors">
                GNN TV
              </Link>
            </li>
            <li>
              <Link href="/resources" className="text-white/65 hover:text-white transition-colors">
                Resources
              </Link>
            </li>
            <li>
              <Link href="/live" className="text-white/65 hover:text-white transition-colors">
                Live
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-5">
            Newsroom
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/admin" className="text-white/65 hover:text-white transition-colors">
                Admin Panel
              </Link>
            </li>
            <li>
              <Link href="/search" className="text-white/65 hover:text-white transition-colors">
                Search
              </Link>
            </li>
            <li className="text-white/30">Careers</li>
            <li className="text-white/30">Advertise</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 text-xs text-white/40 flex flex-wrap justify-between gap-3">
          <span>© {new Date().getFullYear()} GNN — Ghana News Network. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
