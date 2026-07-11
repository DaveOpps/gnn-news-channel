import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import ArticleCard, { CategoryBadge, timeAgo } from "@/components/ArticleCard";
import ArticleImage from "@/components/ArticleImage";
import ReadingProgress from "@/components/ReadingProgress";
import ShareButtons from "@/components/ShareButtons";
import CommentsSection from "@/components/CommentsSection";
import NewsletterSignup from "@/components/NewsletterSignup";
import StarRating from "@/components/StarRating";
import EditorAvatar from "@/components/EditorAvatar";
import { formatByline } from "@/lib/types";
import {
  getBySlug,
  getByCategory,
  getBreaking,
  incrementViews,
  getCommentThreads,
  getEditorForArticle,
  getBySlugForPreview,
  getLiveUpdates,
} from "@/lib/store";
import LiveFeed from "@/components/LiveFeed";
import ArticleBody from "@/components/ArticleBody";
import ReaderTracker from "@/components/ReaderTracker";
import { verifyPreviewToken } from "@/lib/auth";
import { effectiveStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getBySlug(slug);
  if (!article) return { title: "Story not found" };
  const description = article.metaDescription?.trim() || article.excerpt;
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      ...(article.imageUrl ? { images: [article.imageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;

  // A live story is public. Anything else needs a valid, signed preview token.
  let article = getBySlug(slug);
  let isPreview = false;
  if (!article && preview) {
    const candidate = getBySlugForPreview(slug);
    if (candidate && verifyPreviewToken(candidate.id, preview)) {
      article = candidate;
      isPreview = true;
    }
  }
  if (!article) notFound();

  // Previews are editorial, not audience — they must not inflate the count.
  if (!isPreview) incrementViews(article.id);

  const related = getByCategory(article.category)
    .filter((a) => a.id !== article.id)
    .slice(0, 3);
  const comments = getCommentThreads(article.id);
  const liveUpdates = article.isLiveBlog ? getLiveUpdates(article.id) : [];
  const bylineEditor = getEditorForArticle(article);
  const words = article.body.split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <ReadingProgress />
      {/* Previews are editorial, so they never pollute audience numbers. */}
      {!isPreview && <ReaderTracker articleId={article.id} />}

      {isPreview && (
        <div className="bg-amber-400 px-4 py-2.5 text-center text-sm font-semibold text-amber-950">
          Preview — this story is{" "}
          {effectiveStatus(article) === "scheduled" && article.scheduledFor
            ? `scheduled for ${new Date(article.scheduledFor).toLocaleString()}`
            : "an unpublished draft"}{" "}
          and is not visible to the public.
        </div>
      )}

      <SiteHeader />
      <BreakingTicker articles={getBreaking()} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10">
        <article className="bg-white border border-hairline-strong">
          <div className="p-6 md:p-10 pb-0 md:pb-0">
            <div className="flex items-center gap-3 mb-4">
              {article.isLiveBlog && (
                <span className="inline-flex items-center gap-1.5 bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  Live
                </span>
              )}
              <CategoryBadge category={article.category} />
              {article.isBreaking && (
                <span className="bg-ink text-white text-[10px] font-bold tracking-[0.14em] uppercase px-2 py-0.5">
                  Breaking
                </span>
              )}
              <span className="text-xs text-neutral-gray font-medium">
                {readMinutes} min read
              </span>
            </div>
            <h1 className="headline text-4xl md:text-[3.25rem] leading-[1.05] text-ink">
              {article.title}
            </h1>
            <p className="text-lg text-neutral-600 mt-5 leading-relaxed">
              {article.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-6 text-sm text-neutral-gray">
              <span className="flex items-center gap-2.5">
                <EditorAvatar
                  name={bylineEditor?.name ?? article.author}
                  photoUrl={bylineEditor?.photoUrl}
                  size={40}
                />
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold text-ink">
                    {formatByline(article.author, article.coAuthors)}
                  </span>
                  {bylineEditor?.title && (
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-gray">
                      {bylineEditor.title}
                    </span>
                  )}
                </span>
              </span>
              <span>
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span>· {timeAgo(article.publishedAt)}</span>
              <span>· {article.views.toLocaleString()} views</span>
              {(article.rating ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  ·
                  <StarRating value={article.rating} size="sm" />
                  <span className="font-medium">Editor&apos;s rating</span>
                </span>
              )}
            </div>
            <div className="mt-5 pb-6 border-b border-hairline">
              <ShareButtons title={article.title} />
            </div>
          </div>

          <div className="aspect-video mt-6">
            <ArticleImage article={article} />
          </div>

          <div className="p-6 md:p-10 article-body text-neutral-800">
            <ArticleBody body={article.body} />

            {article.isLiveBlog && <LiveFeed updates={liveUpdates} />}

            {article.corrections && article.corrections.length > 0 && (
              <aside className="mt-8 border-l-4 border-amber-400 bg-amber-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
                  Corrections
                </p>
                <ul className="mt-2 space-y-2">
                  {article.corrections.map((c) => (
                    <li key={c.id} className="text-sm text-neutral-700">
                      {c.note}{" "}
                      <span className="text-neutral-gray">
                        —{" "}
                        {new Date(c.at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-hairline">
                {article.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </article>

        <CommentsSection articleId={article.id} initial={comments} />

        {related.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-hairline-strong">
              <span className="w-1.5 h-6 bg-brand"></span>
              <h2 className="font-semibold text-xl uppercase tracking-wide text-ink">
                More in this section
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} size="sm" />
              ))}
            </div>
          </section>
        )}
      </main>

      <NewsletterSignup />
      <SiteFooter />
    </div>
  );
}
