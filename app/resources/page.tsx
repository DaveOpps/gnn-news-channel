import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import NewsletterSignup from "@/components/NewsletterSignup";
import ResourceIconBadge from "@/components/ResourceIcon";
import { getBreaking } from "@/lib/store";
import { resourcesByGroup } from "@/lib/resources";

export const dynamic = "force-dynamic";

export const metadata = { title: "Resources — GNN" };

export default function ResourcesPage() {
  const groups = resourcesByGroup();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <SiteHeader />
      <BreakingTicker articles={getBreaking()} />

      <main className="flex-1 w-full">
        <div className="bg-ink text-white">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h1 className="font-semibold text-2xl md:text-3xl uppercase tracking-wide">
              Resources
            </h1>
            <p className="text-white/55 text-sm mt-2 max-w-xl">
              Tools and services from GNN — currency rates, business listings,
              jobs, classifieds and more, all in one place.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
          {groups.map(({ group, items }) => (
            <section key={group}>
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-hairline-strong">
                <span className="w-1.5 h-6 bg-brand"></span>
                <h2 className="font-semibold text-xl uppercase tracking-wide text-ink">
                  {group}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((r) => (
                  <Link
                    key={r.id}
                    href={r.href}
                    target={r.external ? "_blank" : undefined}
                    className="group flex items-start gap-4 bg-white border border-hairline-strong hover:border-brand p-5 transition-colors"
                  >
                    <ResourceIconBadge
                      icon={r.icon}
                      className="w-11 h-11 rounded-full text-base"
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base text-ink group-hover:text-brand transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-sm text-neutral-gray mt-1 leading-snug">
                        {r.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
