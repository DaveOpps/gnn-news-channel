import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import NewsletterSignup from "@/components/NewsletterSignup";
import ResourceIconBadge from "@/components/ResourceIcon";
import { getBreaking } from "@/lib/store";
import { RESOURCES } from "@/lib/resources";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function findResource(slug: string) {
  return RESOURCES.find((r) => r.href === `/resources/${slug}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = findResource(slug);
  return { title: resource ? `${resource.title} — GNN` : "Resource not found" };
}

export default async function ResourceDetailPage({ params }: Props) {
  const { slug } = await params;
  const resource = findResource(slug);
  if (!resource) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <SiteHeader />
      <BreakingTicker articles={await getBreaking()} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 text-center">
        <ResourceIconBadge
          icon={resource.icon}
          className="w-20 h-20 rounded-full text-3xl mx-auto"
        />
        <h1 className="headline text-3xl mt-6 text-ink">{resource.title}</h1>
        <p className="text-neutral-gray mt-3 max-w-lg mx-auto">
          {resource.description}
        </p>
        <div className="mt-8 inline-block bg-neutral-50 border border-dashed border-hairline-strong px-6 py-4">
          <p className="text-sm font-semibold text-neutral-gray uppercase tracking-wide">
            Coming soon
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            This tool is being built out. Check back shortly.
          </p>
        </div>
        <div className="mt-8">
          <Link
            href="/resources"
            className="text-brand font-semibold text-sm hover:underline"
          >
            ← Back to Resources
          </Link>
        </div>
      </main>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
