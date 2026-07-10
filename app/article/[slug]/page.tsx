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
  getApprovedComments,
  getEditorForArticle,
  getBySlugForPreview,
  getLiveUpdates,
} from "@/lib/store";
import LiveFeed from "@/components/LiveFeed";
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
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
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
  const comments = getApprovedComments(article.id);
  const liveUpdates = article.isLiveBlog ? getLiveUpdates(article.id) : [];
  const bylineEditor = getEditorForArticle(article);
  const paragraphs = article.body.split(/\n\s*\n/).filter(Boolean);
  const words = article.body.split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <ReadingProgress />

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
        <article className="bg-white shadow-sm">
          <div className="p-6 md:p-10 pb-0 md:pb-0">
            <div className="flex items-center gap-3 mb-4">
              {article.isLiveBlog && (
                <span className="inline-flex items-center gap-1.5 bg-brand px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  Live
                </span>
              )}
              <CategoryBadge category={article.category} />
              {article.isBreaking && (
                <span className="bg-ink text-white text-[10px] font-black tracking-[0.15em] uppercase px-2 py-0.5">
                  Breaking
                </span>
              )}
              <span className="text-xs text-neutral-400 font-semibold">
                {readMinutes} min read
              </span>
            </div>
            <h1 className="font-black text-3xl md:text-5xl leading-tight text-ink">
              {article.title}
            </h1>
            <p className="text-lg text-neutral-600 mt-4 leading-relaxed">
              {article.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-6 text-sm text-neutral-500">
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
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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
                  <span className="font-semibold">Editor&apos;s rating</span>
                </span>
              )}
            </div>
            <div className="mt-5 pb-6 border-b border-neutral-200">
              <ShareButtons title={article.title} />
            </div>
          </div>

          <div className="aspect-video mt-6">
            <ArticleImage article={article} />
          </div>

          <div className="p-6 md:p-10 article-body text-neutral-800">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            {article.isLiveBlog && <LiveFeed updates={liveUpdates} />}

            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-neutral-200">
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
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-brand"></span>
              <h2 className="font-black text-xl uppercase tracking-wide">
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
