import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <span className="bg-brand text-white font-black text-2xl px-2.5 py-1 leading-none">
            GNN
          </span>
          <p className="text-white/60 text-sm mt-4 leading-relaxed">
            Global News Network. Breaking news and in-depth coverage, 24 hours a
            day, from every corner of the world.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-white/50 mb-4">
            Sections
          </h4>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/80 hover:text-white">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-white/50 mb-4">
            More
          </h4>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.slice(4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/80 hover:text-white">
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className="text-white/80 hover:text-white">
                Search
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-white/50 mb-4">
            Newsroom
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin" className="text-white/80 hover:text-white">
                Admin Panel
              </Link>
            </li>
            <li className="text-white/40">Careers</li>
            <li className="text-white/40">Advertise with us</li>
            <li className="text-white/40">Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-white/40 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Global News Network. All rights reserved.</span>
          <span>Terms of Use · Privacy Policy · Cookie Settings</span>
        </div>
      </div>
    </footer>
  );
}
