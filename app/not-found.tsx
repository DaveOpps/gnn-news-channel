import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <span className="bg-brand text-white font-black text-5xl px-4 py-2 leading-none">
          404
        </span>
        <h1 className="font-black text-3xl mt-8">This story doesn&apos;t exist</h1>
        <p className="text-neutral-500 mt-3 max-w-md">
          The page you&apos;re looking for may have been moved, deleted, or never
          published.
        </p>
        <Link
          href="/"
          className="mt-8 bg-ink hover:bg-black text-white font-bold text-sm px-6 py-3 uppercase tracking-widest transition-colors"
        >
          Back to the front page
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
