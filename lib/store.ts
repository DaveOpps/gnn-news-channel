import path from "path";
import { del, list, put } from "@vercel/blob";
import { prisma } from "./db";
import type {
  ActivityEventModel,
  ArticleModel,
  CommentModel,
  CorrectionModel,
  EditorModel,
  LiveUpdateModel,
  RevisionModel,
  VideoModel,
} from "./generated/prisma/models";
import {
  ActivityAction,
  ActivityEvent,
  Article,
  ArticleStatus,
  Comment,
  CommentBulkAction,
  CommentStatus,
  CommentThread,
  Correction,
  Curation,
  DEFAULT_MODERATION,
  ModerationSettings,
  Section,
  slugifySection,
  looksLikeSpam,
  Editor,
  EditorRole,
  EditorStats,
  EngagementMap,
  LiveUpdate,
  MediaItem,
  MediaItemWithUsage,
  PublicEditor,
  Revision,
  Subscriber,
  TrendingEntry,
  Video,
  ViewEvent,
  toPublicEditor,
} from "./types";
import { hashPassword } from "./password";

/** Views are high volume — keep a bounded window, not an archive. */
const MAX_EVENTS = 20_000;
const MAX_REVISIONS_PER_ARTICLE = 20;
const MAX_ACTIVITY_EVENTS = 500;

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// ---- Mappers: Prisma rows -> the app's plain TS shapes (Date -> ISO string) ----

const ARTICLE_INCLUDE = { corrections: { orderBy: { at: "asc" as const } } };
type ArticleRow = ArticleModel & { corrections: CorrectionModel[] };

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    author: row.author,
    authorId: row.authorId ?? undefined,
    coAuthors: row.coAuthors,
    imageUrl: row.imageUrl ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    tags: row.tags,
    status: row.status as ArticleStatus,
    scheduledFor: row.scheduledFor?.toISOString(),
    deletedAt: row.deletedAt?.toISOString(),
    isBreaking: row.isBreaking,
    isFeatured: row.isFeatured,
    isLiveBlog: row.isLiveBlog,
    corrections: row.corrections.map(toCorrection),
    rating: row.rating,
    views: row.views,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCorrection(row: CorrectionModel): Correction {
  return { id: row.id, at: row.at.toISOString(), note: row.note, editorName: row.editorName };
}

function toComment(row: CommentModel): Comment {
  return {
    id: row.id,
    articleId: row.articleId,
    name: row.name,
    text: row.text,
    status: row.status as CommentStatus,
    parentId: row.parentId ?? undefined,
    isEditorReply: row.isEditorReply,
    editorId: row.editorId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toLiveUpdate(row: LiveUpdateModel): LiveUpdate {
  return {
    id: row.id,
    articleId: row.articleId,
    body: row.body,
    isKey: row.isKey,
    editorId: row.editorId ?? undefined,
    editorName: row.editorName,
    createdAt: row.createdAt.toISOString(),
  };
}

function toRevision(row: RevisionModel): Revision {
  return {
    id: row.id,
    articleId: row.articleId,
    at: row.at.toISOString(),
    editorId: row.editorId ?? undefined,
    editorName: row.editorName,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    tags: row.tags,
    imageUrl: row.imageUrl ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
  };
}

function toActivityEvent(row: ActivityEventModel): ActivityEvent {
  return {
    id: row.id,
    at: row.at.toISOString(),
    editorId: row.editorId ?? undefined,
    editorName: row.editorName,
    action: row.action as ActivityAction,
    target: row.target,
    targetId: row.targetId ?? undefined,
    detail: row.detail ?? undefined,
  };
}

function toVideo(row: VideoModel): Video {
  return {
    id: row.id,
    title: row.title,
    show: row.show,
    youtubeId: row.youtubeId ?? undefined,
    duration: row.duration,
    views: row.views,
    publishedAt: row.publishedAt.toISOString(),
    featured: row.featured,
  };
}

function toEditor(row: EditorModel): Editor {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    passwordHash: row.passwordHash,
    photoUrl: row.photoUrl ?? undefined,
    title: row.title ?? undefined,
    bio: row.bio ?? undefined,
    role: row.role as EditorRole,
    createdAt: row.createdAt.toISOString(),
  };
}

// ---- Public (live stories only) ----

export async function getPublished(): Promise<Article[]> {
  const now = new Date();
  const rows = await prisma.article.findMany({
    where: {
      deletedAt: null,
      OR: [{ status: "published" }, { status: "scheduled", scheduledFor: { lte: now } }],
    },
    orderBy: { publishedAt: "desc" },
    include: ARTICLE_INCLUDE,
  });
  return rows.map(toArticle);
}

export async function getBySlug(slug: string): Promise<Article | undefined> {
  const now = new Date();
  const row = await prisma.article.findFirst({
    where: {
      slug,
      deletedAt: null,
      OR: [{ status: "published" }, { status: "scheduled", scheduledFor: { lte: now } }],
    },
    include: ARTICLE_INCLUDE,
  });
  return row ? toArticle(row) : undefined;
}

/** Any non-trashed story by slug — used only behind a valid preview token. */
export async function getBySlugForPreview(slug: string): Promise<Article | undefined> {
  const row = await prisma.article.findFirst({
    where: { slug, deletedAt: null },
    include: ARTICLE_INCLUDE,
  });
  return row ? toArticle(row) : undefined;
}

export async function getBreaking(): Promise<Article[]> {
  return (await getPublished()).filter((a) => a.isBreaking);
}

export async function getFeatured(): Promise<Article[]> {
  return (await getPublished()).filter((a) => a.isFeatured);
}

export async function getByCategory(category: string): Promise<Article[]> {
  return (await getPublished()).filter((a) => a.category === category);
}

export async function getTrending(limit = 5): Promise<Article[]> {
  return [...(await getPublished())].sort((a, b) => b.views - a.views).slice(0, limit);
}

export async function searchArticles(q: string): Promise<Article[]> {
  const needle = q.toLowerCase();
  return (await getPublished()).filter(
    (a) =>
      a.title.toLowerCase().includes(needle) ||
      a.excerpt.toLowerCase().includes(needle) ||
      a.body.toLowerCase().includes(needle) ||
      a.tags.some((t) => t.toLowerCase().includes(needle))
  );
}

export async function incrementViews(id: string): Promise<void> {
  const result = await prisma.article.updateMany({
    where: { id },
    data: { views: { increment: 1 } },
  });
  if (result.count > 0) await recordViewEvent(id);
}

// ---- Traffic events ----

async function recordViewEvent(articleId: string): Promise<void> {
  await prisma.viewEvent.create({ data: { articleId } });
  const total = await prisma.viewEvent.count();
  if (total > MAX_EVENTS) {
    const stale = await prisma.viewEvent.findMany({
      orderBy: { t: "asc" },
      take: total - MAX_EVENTS,
      select: { id: true },
    });
    await prisma.viewEvent.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }
}

export async function getViewEvents(sinceMs?: number): Promise<ViewEvent[]> {
  const rows = await prisma.viewEvent.findMany({
    where: {
      articleId: { not: null },
      ...(sinceMs !== undefined && { t: { gte: new Date(sinceMs) } }),
    },
  });
  return rows.map((r) => ({ a: r.articleId as string, t: r.t.getTime() }));
}

/** Daily totals for the last `days` days, oldest first, including empty days. */
export async function getViewsByDay(
  days = 14
): Promise<{ date: string; label: string; count: number }[]> {
  const events = await getViewEvents();
  const buckets = new Map<string, number>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const out: { date: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
    out.push({
      date: key,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  for (const e of events) {
    const key = new Date(e.t).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  for (const row of out) row.count = buckets.get(row.date) ?? 0;
  return out;
}

/**
 * What is accelerating, not merely what is big. Compares views in the last
 * `hours` against the window immediately before it.
 */
export async function getTrendingByVelocity(hours = 6, limit = 6): Promise<TrendingEntry[]> {
  const now = Date.now();
  const windowMs = hours * 3600_000;
  const events = await getViewEvents(now - windowMs * 2);

  const recent = new Map<string, number>();
  const previous = new Map<string, number>();
  for (const e of events) {
    const m = e.t >= now - windowMs ? recent : previous;
    m.set(e.a, (m.get(e.a) ?? 0) + 1);
  }

  const live = new Map((await getPublished()).map((a) => [a.id, a]));

  return [...recent.entries()]
    .map(([id, count]) => {
      const article = live.get(id);
      if (!article) return null;
      const prev = previous.get(id) ?? 0;
      return {
        article,
        recent: count,
        previous: prev,
        velocity: count / hours,
        change: prev > 0 ? ((count - prev) / prev) * 100 : null,
      };
    })
    .filter((x): x is TrendingEntry => x !== null)
    .sort((a, b) => b.recent - a.recent || b.velocity - a.velocity)
    .slice(0, limit);
}

// ---- Engagement (scroll depth / read completion) ----

export async function recordEngagement(
  articleId: string,
  depth: number,
  seconds: number
): Promise<void> {
  const clampedDepth = Math.max(0, Math.min(100, Math.round(depth)));
  const clampedSeconds = Math.max(0, Math.min(3600, Math.round(seconds)));

  await prisma.engagementAgg.upsert({
    where: { articleId },
    create: {
      articleId,
      samples: 1,
      depthSum: clampedDepth,
      secondsSum: clampedSeconds,
      completed: clampedDepth >= 90 ? 1 : 0,
    },
    update: {
      samples: { increment: 1 },
      depthSum: { increment: clampedDepth },
      secondsSum: { increment: clampedSeconds },
      ...(clampedDepth >= 90 && { completed: { increment: 1 } }),
    },
  });
}

export async function getEngagementMap(): Promise<EngagementMap> {
  const rows = await prisma.engagementAgg.findMany();
  const map: EngagementMap = {};
  for (const r of rows) {
    map[r.articleId] = {
      samples: r.samples,
      depthSum: r.depthSum,
      secondsSum: r.secondsSum,
      completed: r.completed,
    };
  }
  return map;
}

// ---- Admin (all active articles) ----

export async function getAll(): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: { deletedAt: null },
    orderBy: { publishedAt: "desc" },
    include: ARTICLE_INCLUDE,
  });
  return rows.map(toArticle);
}

/** Trashed stories, newest deletion first. */
export async function getTrashed(): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: ARTICLE_INCLUDE,
  });
  return rows.map(toArticle);
}

export async function getById(id: string): Promise<Article | undefined> {
  const row = await prisma.article.findUnique({ where: { id }, include: ARTICLE_INCLUDE });
  return row ? toArticle(row) : undefined;
}

export async function createArticle(
  input: Omit<Article, "id" | "slug" | "views" | "publishedAt" | "updatedAt"> & {
    slug?: string;
  }
): Promise<Article> {
  const now = new Date();
  let slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);
  if (!slug) slug = `story-${Date.now()}`;
  // guarantee unique slug
  let unique = slug;
  let n = 2;
  while (await prisma.article.findUnique({ where: { slug: unique }, select: { id: true } })) {
    unique = `${slug}-${n++}`;
  }

  // A scheduled story is dated by when it will go live, so it sorts and reads
  // correctly the moment it appears.
  const publishedAt =
    input.status === "scheduled" && input.scheduledFor ? new Date(input.scheduledFor) : now;

  const row = await prisma.article.create({
    data: {
      id: `a${Date.now()}${Math.floor(Math.random() * 1000)}`,
      slug: unique,
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      category: input.category,
      author: input.author,
      authorId: input.authorId,
      coAuthors: input.coAuthors ?? [],
      imageUrl: input.imageUrl,
      metaDescription: input.metaDescription,
      tags: input.tags,
      status: input.status,
      scheduledFor:
        input.status === "scheduled" && input.scheduledFor ? new Date(input.scheduledFor) : null,
      isBreaking: input.isBreaking,
      isFeatured: input.isFeatured,
      isLiveBlog: input.isLiveBlog ?? false,
      rating: input.rating,
      views: 0,
      publishedAt,
      updatedAt: now,
    },
    include: ARTICLE_INCLUDE,
  });
  return toArticle(row);
}

export async function updateArticle(
  id: string,
  patch: Partial<Omit<Article, "id">>
): Promise<Article | undefined> {
  const currentRow = await prisma.article.findUnique({ where: { id }, include: ARTICLE_INCLUDE });
  if (!currentRow) return undefined;
  const current = toArticle(currentRow);

  let slug = patch.slug;
  if (slug !== undefined) {
    const base = slugify(slug || current.title) || current.slug;
    let unique = base;
    let n = 2;
    while (
      await prisma.article.findFirst({
        where: { slug: unique, id: { not: id } },
        select: { id: true },
      })
    ) {
      unique = `${base}-${n++}`;
    }
    slug = unique;
  }

  const nextStatus = patch.status ?? current.status;
  const nextSchedule = patch.scheduledFor ?? current.scheduledFor;

  let publishedAt = patch.publishedAt;
  let scheduledFor = patch.scheduledFor;
  let clearSchedule = false;

  if (nextStatus === "scheduled" && nextSchedule) {
    // Keep the publish date pinned to the moment it will go live.
    publishedAt = nextSchedule;
  } else if (nextStatus === "published") {
    // Publishing outright cancels any schedule, and a future date would sort
    // the story above everything and read as tomorrow's news.
    clearSchedule = true;
    const stamped = publishedAt ?? current.publishedAt;
    if (new Date(stamped).getTime() > Date.now()) {
      publishedAt = new Date().toISOString();
    }
  }

  const row = await prisma.article.update({
    where: { id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.excerpt !== undefined && { excerpt: patch.excerpt }),
      ...(patch.body !== undefined && { body: patch.body }),
      ...(patch.category !== undefined && { category: patch.category }),
      ...(patch.author !== undefined && { author: patch.author }),
      ...(patch.authorId !== undefined && { authorId: patch.authorId || null }),
      ...(patch.coAuthors !== undefined && { coAuthors: patch.coAuthors }),
      ...(patch.imageUrl !== undefined && { imageUrl: patch.imageUrl || null }),
      ...(patch.metaDescription !== undefined && {
        metaDescription: patch.metaDescription || null,
      }),
      ...(patch.tags !== undefined && { tags: patch.tags }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(clearSchedule
        ? { scheduledFor: null }
        : scheduledFor !== undefined && {
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          }),
      ...(patch.deletedAt !== undefined && {
        deletedAt: patch.deletedAt ? new Date(patch.deletedAt) : null,
      }),
      ...(patch.isBreaking !== undefined && { isBreaking: patch.isBreaking }),
      ...(patch.isFeatured !== undefined && { isFeatured: patch.isFeatured }),
      ...(patch.isLiveBlog !== undefined && { isLiveBlog: patch.isLiveBlog }),
      ...(patch.rating !== undefined && { rating: patch.rating }),
      ...(patch.views !== undefined && { views: patch.views }),
      ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
      updatedAt: new Date(),
    },
    include: ARTICLE_INCLUDE,
  });
  return toArticle(row);
}

/** Move a story to the trash. Comments are kept so a restore is lossless. */
export async function trashArticle(id: string): Promise<boolean> {
  const result = await prisma.article.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

export async function restoreArticle(id: string): Promise<Article | undefined> {
  const result = await prisma.article.updateMany({
    where: { id, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (result.count === 0) return undefined;
  return getById(id);
}

/** Permanently remove a trashed story. Cascades to comments, live updates,
 *  revisions, corrections and engagement via the schema's foreign keys. */
export async function purgeArticle(id: string): Promise<boolean> {
  const result = await prisma.article.deleteMany({ where: { id } });
  return result.count > 0;
}

// ---- Gh News TV videos ----

export async function getVideos(): Promise<Video[]> {
  const rows = await prisma.video.findMany({ orderBy: { publishedAt: "desc" } });
  return rows.map(toVideo);
}

export async function getVideoById(id: string): Promise<Video | undefined> {
  const row = await prisma.video.findUnique({ where: { id } });
  return row ? toVideo(row) : undefined;
}

export async function getVideosByShow(show: string): Promise<Video[]> {
  const rows = await prisma.video.findMany({ where: { show }, orderBy: { publishedAt: "desc" } });
  return rows.map(toVideo);
}

export async function createVideo(
  input: Omit<Video, "id" | "views" | "publishedAt"> & { publishedAt?: string }
): Promise<Video> {
  const row = await prisma.video.create({
    data: {
      id: `v${Date.now()}${Math.floor(Math.random() * 1000)}`,
      title: input.title,
      show: input.show,
      youtubeId: input.youtubeId,
      duration: input.duration,
      views: 0,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
      featured: input.featured ?? false,
    },
  });
  return toVideo(row);
}

export async function updateVideo(
  id: string,
  patch: Partial<Omit<Video, "id">>
): Promise<Video | undefined> {
  const result = await prisma.video.updateMany({
    where: { id },
    data: {
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.show !== undefined && { show: patch.show }),
      ...(patch.youtubeId !== undefined && { youtubeId: patch.youtubeId }),
      ...(patch.duration !== undefined && { duration: patch.duration }),
      ...(patch.views !== undefined && { views: patch.views }),
      ...(patch.publishedAt !== undefined && { publishedAt: new Date(patch.publishedAt) }),
      ...(patch.featured !== undefined && { featured: patch.featured }),
    },
  });
  if (result.count === 0) return undefined;
  return getVideoById(id);
}

export async function deleteVideo(id: string): Promise<boolean> {
  const result = await prisma.video.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function incrementVideoViews(id: string): Promise<void> {
  await prisma.video.updateMany({ where: { id }, data: { views: { increment: 1 } } });
}

// ---- Sections ----

/** The live section list, ordered. */
export async function getSections(): Promise<Section[]> {
  return prisma.section.findMany({ orderBy: { order: "asc" } });
}

/** How many active stories sit in each section — used to guard deletion. */
export async function countArticlesBySection(): Promise<Record<string, number>> {
  const groups = await prisma.article.groupBy({
    by: ["category"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const g of groups) counts[g.category] = g._count._all;
  return counts;
}

export async function createSection(
  label: string,
  color: string
): Promise<{ ok: true; section: Section } | { ok: false; reason: string }> {
  const slug = slugifySection(label);
  if (!slug) return { ok: false, reason: "That name has no usable letters" };
  const existing = await prisma.section.findUnique({ where: { slug } });
  if (existing) {
    return { ok: false, reason: `A section with the slug "${slug}" already exists` };
  }

  const count = await prisma.section.count();
  const section = await prisma.section.create({
    data: {
      slug,
      label: label.trim().slice(0, 40),
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#71717a",
      order: count,
    },
  });
  return { ok: true, section };
}

/** The slug is the public URL, so it never changes — only label, colour, order. */
export async function updateSection(
  slug: string,
  patch: { label?: string; color?: string; order?: number }
): Promise<Section | undefined> {
  const existing = await prisma.section.findUnique({ where: { slug } });
  if (!existing) return undefined;

  return prisma.section.update({
    where: { slug },
    data: {
      ...(patch.label !== undefined && { label: patch.label.trim().slice(0, 40) }),
      ...(patch.color !== undefined &&
        /^#[0-9a-f]{6}$/i.test(patch.color) && { color: patch.color }),
      ...(patch.order !== undefined && { order: patch.order }),
    },
  });
}

export async function reorderSections(slugs: string[]): Promise<Section[]> {
  await Promise.all(
    slugs.map((slug, i) => prisma.section.updateMany({ where: { slug }, data: { order: i } }))
  );
  return getSections();
}

/**
 * Deleting a section that still holds stories would orphan them, so it is
 * refused. The last section can never be deleted either — an article must
 * always have somewhere to live.
 */
export async function deleteSection(
  slug: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const total = await prisma.section.count();
  if (total <= 1) {
    return { ok: false, reason: "A newsroom needs at least one section" };
  }
  const existing = await prisma.section.findUnique({ where: { slug } });
  if (!existing) {
    return { ok: false, reason: "No such section" };
  }

  const count = await prisma.article.count({ where: { category: slug, deletedAt: null } });
  if (count > 0) {
    return {
      ok: false,
      reason: `${count} ${count === 1 ? "story is" : "stories are"} still filed under this section. Move them first.`,
    };
  }

  await prisma.section.delete({ where: { slug } });
  return { ok: true };
}

// ---- Corrections ----

/** Corrections are appended, never edited — that is the whole point of them. */
export async function addCorrection(
  articleId: string,
  note: string,
  editorName: string
): Promise<Article | undefined> {
  const exists = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!exists) return undefined;

  await prisma.correction.create({
    data: {
      id: `x${Date.now()}${Math.floor(Math.random() * 1000)}`,
      articleId,
      note: note.trim().slice(0, 1000),
      editorName,
    },
  });
  await prisma.article.update({ where: { id: articleId }, data: { updatedAt: new Date() } });
  return getById(articleId);
}

export async function deleteCorrection(
  articleId: string,
  correctionId: string
): Promise<Article | undefined> {
  const exists = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!exists) return undefined;

  await prisma.correction.deleteMany({ where: { id: correctionId, articleId } });
  return getById(articleId);
}

// ---- Revision history ----

/** True when a patch touches anything worth remembering. */
export function touchesContent(
  current: Article,
  patch: Partial<Omit<Article, "id">>
): boolean {
  const REVISIONED_FIELDS = [
    "title",
    "slug",
    "excerpt",
    "body",
    "category",
    "tags",
    "imageUrl",
    "metaDescription",
  ] as const;
  return REVISIONED_FIELDS.some((field) => {
    if (patch[field] === undefined) return false;
    const a = patch[field];
    const b = current[field];
    if (Array.isArray(a) && Array.isArray(b)) return a.join(" ") !== b.join(" ");
    return a !== b;
  });
}

/** Snapshot the article as it stands, before an edit overwrites it. */
export async function addRevision(
  article: Article,
  editor: { id: string; name: string } | null
): Promise<Revision> {
  const row = await prisma.revision.create({
    data: {
      id: `r${Date.now()}${Math.floor(Math.random() * 1000)}`,
      articleId: article.id,
      editorId: editor?.id,
      editorName: editor?.name ?? "Someone",
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: article.body,
      category: article.category,
      tags: [...article.tags],
      imageUrl: article.imageUrl,
      metaDescription: article.metaDescription,
    },
  });

  // Trim this article's history only — other articles keep theirs.
  const total = await prisma.revision.count({ where: { articleId: article.id } });
  if (total > MAX_REVISIONS_PER_ARTICLE) {
    const stale = await prisma.revision.findMany({
      where: { articleId: article.id },
      orderBy: { at: "asc" },
      take: total - MAX_REVISIONS_PER_ARTICLE,
      select: { id: true },
    });
    await prisma.revision.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }

  return toRevision(row);
}

export async function getRevisions(articleId: string): Promise<Revision[]> {
  const rows = await prisma.revision.findMany({
    where: { articleId },
    orderBy: { at: "desc" },
  });
  return rows.map(toRevision);
}

export async function getRevisionById(id: string): Promise<Revision | undefined> {
  const row = await prisma.revision.findUnique({ where: { id } });
  return row ? toRevision(row) : undefined;
}

// ---- Live blog updates ----

/** Newest first — a live blog reads top-down like a wire feed. */
export async function getLiveUpdates(articleId: string): Promise<LiveUpdate[]> {
  const rows = await prisma.liveUpdate.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toLiveUpdate);
}

export async function countLiveUpdates(articleId: string): Promise<number> {
  return prisma.liveUpdate.count({ where: { articleId } });
}

export async function addLiveUpdate(
  articleId: string,
  body: string,
  editor: { id: string; name: string },
  isKey = false
): Promise<LiveUpdate> {
  const row = await prisma.liveUpdate.create({
    data: {
      id: `u${Date.now()}${Math.floor(Math.random() * 1000)}`,
      articleId,
      body: body.slice(0, 5000),
      isKey,
      editorId: editor.id,
      editorName: editor.name,
    },
  });
  return toLiveUpdate(row);
}

export async function getLiveUpdateById(id: string): Promise<LiveUpdate | undefined> {
  const row = await prisma.liveUpdate.findUnique({ where: { id } });
  return row ? toLiveUpdate(row) : undefined;
}

export async function setLiveUpdateKey(
  id: string,
  isKey: boolean
): Promise<LiveUpdate | undefined> {
  const result = await prisma.liveUpdate.updateMany({ where: { id }, data: { isKey } });
  if (result.count === 0) return undefined;
  return getLiveUpdateById(id);
}

export async function deleteLiveUpdate(id: string): Promise<boolean> {
  const result = await prisma.liveUpdate.deleteMany({ where: { id } });
  return result.count > 0;
}

// ---- Media library ----
//
// Vercel Blob is the source of truth for what files exist (mirroring the old
// fs.readdirSync-over-public/uploads design); Postgres holds only the extras
// (alt text, who uploaded it) keyed by the blob's pathname.

export async function getMediaItems(): Promise<MediaItem[]> {
  const { blobs } = await list();
  const images = blobs.filter((b) => /\.(jpe?g|png|webp|gif|avif)$/i.test(b.pathname));
  const filenames = images.map((b) => b.pathname);
  const metaRows = filenames.length
    ? await prisma.mediaItem.findMany({ where: { filename: { in: filenames } } })
    : [];
  const meta = new Map(metaRows.map((m) => [m.filename, m]));

  return images
    .map((b) => {
      const m = meta.get(b.pathname);
      return {
        filename: b.pathname,
        url: b.url,
        size: m?.size ?? b.size,
        alt: m?.alt ?? undefined,
        uploadedBy: m?.uploadedBy ?? undefined,
        createdAt: (m?.createdAt ?? b.uploadedAt).toISOString(),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordMedia(item: MediaItem): Promise<void> {
  await prisma.mediaItem.upsert({
    where: { filename: item.filename },
    update: { url: item.url, size: item.size, alt: item.alt, uploadedBy: item.uploadedBy },
    create: {
      filename: item.filename,
      url: item.url,
      size: item.size,
      alt: item.alt,
      uploadedBy: item.uploadedBy,
      createdAt: new Date(item.createdAt),
    },
  });
}

export async function setMediaAlt(filename: string, alt: string): Promise<boolean> {
  await prisma.mediaItem.upsert({
    where: { filename },
    update: { alt: alt.slice(0, 300) },
    create: { filename, url: "", size: 0, alt: alt.slice(0, 300) },
  });
  return true;
}

/** Which live/active stories reference this image, as a hero or inline. */
export async function getMediaUsage(url: string): Promise<{ id: string; title: string }[]> {
  return prisma.article.findMany({
    where: { deletedAt: null, OR: [{ imageUrl: url }, { body: { contains: url } }] },
    select: { id: true, title: true },
  });
}

export async function getMediaWithUsage(): Promise<MediaItemWithUsage[]> {
  const items = await getMediaItems();
  return Promise.all(items.map(async (m) => ({ ...m, usedBy: await getMediaUsage(m.url) })));
}

export async function deleteMediaFile(filename: string): Promise<boolean> {
  // Never let a traversal escape the intended pathname.
  const safe = path.basename(filename);
  try {
    await del(safe);
  } catch {
    return false;
  }
  await prisma.mediaItem.deleteMany({ where: { filename: safe } });
  return true;
}

// ---- Homepage curation ----

const CURATION_ID = "singleton";

export async function getCuration(): Promise<Curation | null> {
  const row = await prisma.curation.findUnique({ where: { id: CURATION_ID } });
  if (!row) return null;
  return {
    heroId: row.heroId ?? undefined,
    topStoryIds: row.topStoryIds,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
  };
}

export async function setCuration(
  heroId: string | undefined,
  topStoryIds: string[],
  updatedBy?: string
): Promise<Curation> {
  const data = {
    heroId: heroId || null,
    topStoryIds: topStoryIds.slice(0, 8),
    updatedBy: updatedBy ?? null,
  };
  const row = await prisma.curation.upsert({
    where: { id: CURATION_ID },
    update: data,
    create: { id: CURATION_ID, ...data },
  });
  return {
    heroId: row.heroId ?? undefined,
    topStoryIds: row.topStoryIds,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
  };
}

export async function clearCuration(): Promise<void> {
  await prisma.curation.deleteMany({ where: { id: CURATION_ID } });
}

/**
 * The front page, honouring manual curation but never trusting it blindly:
 * a curated story that has since been unpublished or trashed simply drops out
 * and the automatic pick fills the gap.
 */
export async function getHomepage(): Promise<{
  hero?: Article;
  topStories: Article[];
  latest: Article[];
  isCurated: boolean;
}> {
  const published = await getPublished();
  if (published.length === 0) {
    return { topStories: [], latest: [], isCurated: false };
  }

  const curation = await getCuration();
  const byId = new Map(published.map((a) => [a.id, a]));

  const curatedHero = curation?.heroId ? byId.get(curation.heroId) : undefined;
  const hero = curatedHero ?? published.find((a) => a.isFeatured) ?? published[0];

  const curatedTop = (curation?.topStoryIds ?? [])
    .map((id) => byId.get(id))
    .filter((a): a is Article => Boolean(a) && a!.id !== hero.id);

  const topStories = curatedTop.length
    ? curatedTop.slice(0, 4)
    : published.filter((a) => a.id !== hero.id).slice(0, 4);

  const usedIds = new Set([hero.id, ...topStories.map((a) => a.id)]);
  const latest = published.filter((a) => !usedIds.has(a.id)).slice(0, 6);

  return {
    hero,
    topStories,
    latest,
    isCurated: Boolean(curatedHero || curatedTop.length),
  };
}

// ---- Activity log ----

export async function logActivity(event: Omit<ActivityEvent, "id" | "at">): Promise<ActivityEvent> {
  const row = await prisma.activityEvent.create({
    data: {
      id: `e${Date.now()}${Math.floor(Math.random() * 1000)}`,
      editorId: event.editorId,
      editorName: event.editorName,
      action: event.action,
      target: event.target,
      targetId: event.targetId,
      detail: event.detail,
    },
  });

  // Keep the log bounded — this is a newsroom feed, not an archive.
  const total = await prisma.activityEvent.count();
  if (total > MAX_ACTIVITY_EVENTS) {
    const stale = await prisma.activityEvent.findMany({
      orderBy: { at: "asc" },
      take: total - MAX_ACTIVITY_EVENTS,
      select: { id: true },
    });
    await prisma.activityEvent.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }

  return toActivityEvent(row);
}

export async function getActivity(limit = 100): Promise<ActivityEvent[]> {
  const rows = await prisma.activityEvent.findMany({
    orderBy: { at: "desc" },
    take: limit,
  });
  return rows.map(toActivityEvent);
}

/** Convenience wrapper so callers don't repeat the action-name strings. */
export async function recordArticleAction(
  action: ActivityAction,
  editor: { id: string; name: string } | null,
  article: { id: string; title: string },
  detail?: string
): Promise<void> {
  await logActivity({
    action,
    editorId: editor?.id,
    editorName: editor?.name ?? "Someone",
    target: article.title,
    targetId: article.id,
    detail,
  });
}

// ---- Comments ----

export async function getApprovedComments(articleId: string): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({
    where: { articleId, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toComment);
}

/**
 * Approved top-level comments, each carrying its approved replies oldest-first
 * (a conversation reads forwards, even though the threads themselves are
 * newest-first).
 */
export async function getCommentThreads(articleId: string): Promise<CommentThread[]> {
  const approved = await getApprovedComments(articleId);
  const tops = approved.filter((c) => !c.parentId);
  return tops.map((top) => ({
    ...top,
    replies: approved
      .filter((c) => c.parentId === top.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}

export async function getAllComments(): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toComment);
}

export async function getCommentById(id: string): Promise<Comment | undefined> {
  const row = await prisma.comment.findUnique({ where: { id } });
  return row ? toComment(row) : undefined;
}

export async function countPendingComments(): Promise<number> {
  return prisma.comment.count({ where: { status: "pending" } });
}

export async function countSpamComments(): Promise<number> {
  return prisma.comment.count({ where: { status: "spam" } });
}

/** A reader comment. Blocked words send it straight to the spam tray. */
export async function addComment(articleId: string, name: string, text: string): Promise<Comment> {
  const settings = await getModerationSettings();
  const row = await prisma.comment.create({
    data: {
      id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`,
      articleId,
      name: name.slice(0, 60),
      text: text.slice(0, 2000),
      status: looksLikeSpam(name, text, settings) ? "spam" : "pending",
    },
  });
  return toComment(row);
}

/** An official newsroom response. Published immediately — an editor is trusted. */
export async function addEditorReply(
  parentId: string,
  text: string,
  editor: { id: string; name: string }
): Promise<Comment | undefined> {
  const parent = await prisma.comment.findUnique({ where: { id: parentId } });
  if (!parent) return undefined;

  const row = await prisma.comment.create({
    data: {
      id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`,
      articleId: parent.articleId,
      name: editor.name,
      text: text.slice(0, 2000),
      status: "approved",
      parentId,
      isEditorReply: true,
      editorId: editor.id,
    },
  });
  return toComment(row);
}

export async function setCommentStatus(
  id: string,
  status: CommentStatus
): Promise<Comment | undefined> {
  const result = await prisma.comment.updateMany({ where: { id }, data: { status } });
  if (result.count === 0) return undefined;
  return getCommentById(id);
}

/** Deleting a comment takes its replies with it via the schema's cascade. */
export async function deleteComment(id: string): Promise<boolean> {
  const result = await prisma.comment.deleteMany({ where: { id } });
  return result.count > 0;
}

/** Apply one action across many comments in a single write. */
export async function bulkComments(
  ids: string[],
  action: CommentBulkAction
): Promise<{ updated: number }> {
  if (action === "delete") {
    const result = await prisma.comment.deleteMany({
      where: { OR: [{ id: { in: ids } }, { parentId: { in: ids } }] },
    });
    return { updated: result.count };
  }

  const result = await prisma.comment.updateMany({
    where: { id: { in: ids } },
    data: { status: action === "approve" ? "approved" : "spam" },
  });
  return { updated: result.count };
}

// ---- Moderation settings ----

const MODERATION_ID = "singleton";

export async function getModerationSettings(): Promise<ModerationSettings> {
  const row = await prisma.moderationSettings.findUnique({ where: { id: MODERATION_ID } });
  if (!row) return DEFAULT_MODERATION;
  return { blockedTerms: row.blockedTerms, blockedNames: row.blockedNames };
}

export async function setModerationSettings(
  settings: ModerationSettings
): Promise<ModerationSettings> {
  const clean: ModerationSettings = {
    blockedTerms: settings.blockedTerms.map((t) => t.trim()).filter(Boolean).slice(0, 200),
    blockedNames: settings.blockedNames.map((n) => n.trim()).filter(Boolean).slice(0, 200),
  };
  await prisma.moderationSettings.upsert({
    where: { id: MODERATION_ID },
    update: clean,
    create: { id: MODERATION_ID, ...clean },
  });
  return clean;
}

// ---- Newsletter subscribers ----

export async function getSubscribers(): Promise<Subscriber[]> {
  const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({ email: r.email, createdAt: r.createdAt.toISOString() }));
}

export async function addSubscriber(email: string): Promise<{ ok: boolean; reason?: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, reason: "Please enter a valid email address" };
  }
  const existing = await prisma.subscriber.findUnique({ where: { email: clean } });
  if (existing) {
    return { ok: false, reason: "You are already subscribed" };
  }
  await prisma.subscriber.create({ data: { email: clean } });
  return { ok: true };
}

export async function removeSubscriber(email: string): Promise<boolean> {
  const result = await prisma.subscriber.deleteMany({
    where: { email: email.trim().toLowerCase() },
  });
  return result.count > 0;
}

// ---- Editors (accounts) ----

export async function getEditors(): Promise<Editor[]> {
  const rows = await prisma.editor.findMany({ orderBy: { name: "asc" } });
  return rows.map(toEditor);
}

/** Credential-free list, safe to hand to client components. */
export async function getPublicEditors(): Promise<PublicEditor[]> {
  return (await getEditors()).map(toPublicEditor);
}

export async function getEditorById(id: string): Promise<Editor | undefined> {
  const row = await prisma.editor.findUnique({ where: { id } });
  return row ? toEditor(row) : undefined;
}

/** Public-safe editor lookup — for author pages and other reader-facing use. */
export async function getPublicEditorById(id: string): Promise<PublicEditor | undefined> {
  const editor = await getEditorById(id);
  return editor ? toPublicEditor(editor) : undefined;
}

/** A byline-linkable id for an article: the editor account if one matches. */
export async function getEditorIdForArticle(article: Article): Promise<string | undefined> {
  return (await getEditorForArticle(article))?.id;
}

/** An editor's published stories, newest first — powers their author page. */
export async function getPublishedByEditor(editorId: string): Promise<Article[]> {
  const editor = await getEditorById(editorId);
  if (!editor) return [];
  return (await getPublished()).filter((a) => isAuthoredBy(a, editor));
}

export async function getEditorByUsername(username: string): Promise<Editor | undefined> {
  const row = await prisma.editor.findUnique({ where: { username: username.trim().toLowerCase() } });
  return row ? toEditor(row) : undefined;
}

export type EditorResult = { ok: true; editor: Editor } | { ok: false; reason: string };

export async function createEditor(input: {
  name: string;
  username: string;
  password: string;
  photoUrl?: string;
  title?: string;
  bio?: string;
  role?: EditorRole;
}): Promise<EditorResult> {
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const password = input.password;

  if (name.length < 2) return { ok: false, reason: "Name is too short" };
  if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
    return {
      ok: false,
      reason: "Username must be 3–24 characters: letters, numbers, . _ - only",
    };
  }
  if (password.length < 6) {
    return { ok: false, reason: "Password must be at least 6 characters" };
  }

  const existing = await prisma.editor.findUnique({ where: { username } });
  if (existing) {
    return { ok: false, reason: "That username is already taken" };
  }

  const row = await prisma.editor.create({
    data: {
      id: `ed${Date.now()}${Math.floor(Math.random() * 1000)}`,
      name,
      username,
      passwordHash: hashPassword(password),
      photoUrl: input.photoUrl?.trim() || undefined,
      title: input.title?.trim() || undefined,
      bio: input.bio?.trim().slice(0, 400) || undefined,
      role: input.role === "admin" ? "admin" : "editor",
    },
  });
  return { ok: true, editor: toEditor(row) };
}

export async function updateEditor(
  id: string,
  patch: {
    name?: string;
    username?: string;
    password?: string;
    photoUrl?: string;
    title?: string;
    bio?: string;
    role?: EditorRole;
  }
): Promise<EditorResult> {
  const current = await prisma.editor.findUnique({ where: { id } });
  if (!current) return { ok: false, reason: "Editor not found" };

  let name: string | undefined;
  if (patch.name !== undefined) {
    name = patch.name.trim();
    if (name.length < 2) return { ok: false, reason: "Name is too short" };
  }

  let username: string | undefined;
  if (patch.username !== undefined) {
    username = patch.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      return { ok: false, reason: "Invalid username" };
    }
    const clash = await prisma.editor.findFirst({ where: { username, id: { not: id } } });
    if (clash) {
      return { ok: false, reason: "That username is already taken" };
    }
  }

  let passwordHash: string | undefined;
  if (patch.password) {
    if (patch.password.length < 6) {
      return { ok: false, reason: "Password must be at least 6 characters" };
    }
    passwordHash = hashPassword(patch.password);
  }

  if (patch.role !== undefined && patch.role !== current.role) {
    // Never demote the last remaining admin — that would lock everyone out.
    if (current.role === "admin") {
      const admins = await prisma.editor.count({ where: { role: "admin" } });
      if (admins === 1) {
        return { ok: false, reason: "This is the only admin — promote someone else first" };
      }
    }
  }

  const row = await prisma.editor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
      ...(passwordHash !== undefined && { passwordHash }),
      ...(patch.photoUrl !== undefined && { photoUrl: patch.photoUrl.trim() || null }),
      ...(patch.title !== undefined && { title: patch.title.trim() || null }),
      ...(patch.bio !== undefined && { bio: patch.bio.trim().slice(0, 400) || null }),
      ...(patch.role !== undefined && { role: patch.role }),
    },
  });
  return { ok: true, editor: toEditor(row) };
}

export async function deleteEditor(id: string): Promise<{ ok: boolean; reason?: string }> {
  const target = await prisma.editor.findUnique({ where: { id } });
  if (!target) return { ok: false, reason: "Editor not found" };
  if (target.role === "admin") {
    const admins = await prisma.editor.count({ where: { role: "admin" } });
    if (admins === 1) return { ok: false, reason: "Can't remove the only admin" };
  }
  await prisma.editor.delete({ where: { id } });
  // Their articles stay published; the byline keeps the stored author name.
  return { ok: true };
}

/** True when this article belongs to the given editor (id link, or legacy name match). */
export function isAuthoredBy(article: Article, editor: Editor | PublicEditor): boolean {
  if (article.authorId) return article.authorId === editor.id;
  return article.author.trim().toLowerCase() === editor.name.trim().toLowerCase();
}

/** The editor account behind an article's byline, if one exists. */
export async function getEditorForArticle(article: Article): Promise<PublicEditor | undefined> {
  const editors = await getEditors();
  const match = editors.find((e) => isAuthoredBy(article, e));
  return match ? toPublicEditor(match) : undefined;
}

/** Per-editor performance, sorted by total views. Powers the analytics board. */
export async function getEditorStats(): Promise<EditorStats[]> {
  const [editors, articles] = await Promise.all([getEditors(), getAll()]);
  return editors
    .map((editor) => {
      const mine = articles.filter((a) => isAuthoredBy(a, editor));
      const published = mine.filter((a) => a.status === "published");
      const rated = mine.filter((a) => a.rating > 0);
      return {
        editor: toPublicEditor(editor),
        published: published.length,
        drafts: mine.length - published.length,
        totalViews: published.reduce((sum, a) => sum + a.views, 0),
        avgRating: rated.length
          ? Math.round((rated.reduce((s, a) => s + a.rating, 0) / rated.length) * 10) / 10
          : 0,
        breaking: mine.filter((a) => a.isBreaking).length,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);
}

// re-exported so app/api/upload/route.ts can put() new files with the same
// naming convention without importing @vercel/blob directly.
export { put };
