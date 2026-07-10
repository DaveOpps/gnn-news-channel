import Link from "next/link";
import { getSections } from "@/lib/store";

export default function SiteFooter() {
  const CATEGORIES = getSections();
  return (
    <footer className="bg-neutral-dark text-white mt-20 border-t-4 border-brand">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-2">
            <span className="bg-gradient-to-r from-brand to-brand-dark text-white font-black text-3xl px-3 py-2 leading-none inline-block">
              GNN
            </span>
          </div>
          <p className="text-white/60 text-sm mt-4 leading-relaxed font-medium">
            Ghana&apos;s leading digital news source. Breaking news, politics, business, sports, and entertainment coverage 24/7.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="#" className="w-8 h-8 bg-white/10 hover:bg-brand rounded flex items-center justify-center transition-colors text-sm">f</a>
            <a href="#" className="w-8 h-8 bg-white/10 hover:bg-brand rounded flex items-center justify-center transition-colors text-sm">𝕏</a>
            <a href="#" className="w-8 h-8 bg-white/10 hover:bg-brand rounded flex items-center justify-center transition-colors text-sm">in</a>
          </div>
        </div>
        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-brand-accent mb-6">
            News
          </h4>
          <ul className="space-y-3 text-sm">
            {CATEGORIES.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/70 hover:text-white hover:text-brand font-medium transition-colors">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-brand-accent mb-6">
            More
          </h4>
          <ul className="space-y-3 text-sm">
            {CATEGORIES.slice(4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/70 hover:text-white hover:text-brand font-medium transition-colors">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-brand-accent mb-6">
            Newsroom
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/admin" className="text-white/70 hover:text-white font-medium transition-colors">
                Admin Panel
              </Link>
            </li>
            <li>
              <Link href="/search" className="text-white/70 hover:text-white font-medium transition-colors">
                Search
              </Link>
            </li>
            <li className="text-white/40 font-medium">Careers</li>
            <li className="text-white/40 font-medium">Advertise</li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-white/50 flex flex-wrap justify-between gap-4">
          <span className="font-medium">© {new Date().getFullYear()} GNN - Ghana News Network. All rights reserved.</span>
          <div className="flex gap-4 font-medium">
            <Link href="#" className="hover:text-brand transition-colors">Terms of Use</Link>
            <Link href="#" className="hover:text-brand transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-brand transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
