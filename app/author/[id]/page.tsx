import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard from "@/components/ArticleCard";
import EditorAvatar from "@/components/EditorAvatar";
import { getBreaking, getPublicEditorById, getPublishedByEditor } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const editor = await getPublicEditorById(id);
  if (!editor) return { title: "Editor not found" };
  return {
    title: editor.name,
    description: editor.bio || `Stories by ${editor.name} on Gh News.`,
  };
}

export default async function AuthorPage({ params }: Props) {
  const { id } = await params;
  const editor = await getPublicEditorById(id);
  if (!editor) notFound();

  const articles = await getPublishedByEditor(id);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <SiteHeader />
      <BreakingTicker articles={await getBreaking()} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-12">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 mb-10 border-b border-hairline-strong">
          <EditorAvatar name={editor.name} photoUrl={editor.photoUrl} size={104} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand mb-1.5">
              Gh News {editor.role === "admin" ? "Editor-in-Chief" : "Correspondent"}
            </p>
            <h1 className="headline text-3xl md:text-4xl text-ink">{editor.name}</h1>
            {editor.title && (
              <p className="text-neutral-gray text-sm mt-1.5 font-medium">{editor.title}</p>
            )}
            {editor.bio && (
              <p className="text-neutral-600 text-base mt-4 max-w-2xl leading-relaxed">
                {editor.bio}
              </p>
            )}
            <p className="text-neutral-gray text-xs mt-4">
              {articles.length} {articles.length === 1 ? "story" : "stories"} published
            </p>
          </div>
        </div>

        {/* Their stories */}
        {articles.length === 0 ? (
          <p className="text-neutral-gray py-16 text-center">
            No published stories from {editor.name} yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
