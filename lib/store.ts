import fs from "fs";
import path from "path";
import {
  ActivityAction,
  ActivityEvent,
  Article,
  Comment,
  CommentBulkAction,
  CommentStatus,
  CommentThread,
  Correction,
  Curation,
  DEFAULT_MODERATION,
  DEFAULT_SECTIONS,
  ModerationSettings,
  Section,
  looksLikeSpam,
  slugifySection,
  Editor,
  EditorRole,
  EditorStats,
  EngagementMap,
  LiveUpdate,
  MediaItem,
  MediaItemWithUsage,
  PublicEditor,
  REVISIONED_FIELDS,
  Revision,
  Subscriber,
  TrendingEntry,
  ViewEvent,
  isArticleLive,
  toPublicEditor,
} from "./types";
import { SEED_ARTICLES, SEED_EDITORS } from "./seed";
import { hashPassword } from "./password";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "articles.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const LIVE_FILE = path.join(DATA_DIR, "live-updates.json");
const CURATION_FILE = path.join(DATA_DIR, "curation.json");
const MEDIA_FILE = path.join(DATA_DIR, "media.json");
const REVISIONS_FILE = path.join(DATA_DIR, "revisions.json");
const MODERATION_FILE = path.join(DATA_DIR, "moderation.json");
const SECTIONS_FILE = path.join(DATA_DIR, "sections.json");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const ENGAGEMENT_FILE = path.join(DATA_DIR, "engagement.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Views are high volume — keep a bounded window, not an archive. */
const MAX_EVENTS = 20_000;
const EDITORS_FILE = path.join(DATA_DIR, "editors.json");

/**
 * On a writable filesystem (local dev) we persist to JSON files.
 * On a read-only serverless filesystem (e.g. Vercel) the first write attempt
 * throws EROFS/EACCES; we then transparently fall back to an in-memory store
 * seeded from the bundled data. State survives while the instance stays warm
 * and resets on cold starts — good enough to browse and demo, not durable.
 */
let useMemory = false;
const memStore: Record<string, unknown> = {};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readJson<T>(file: string, fallback: T): T {
  if (useMemory) {
    if (!(file in memStore)) memStore[file] = clone(fallback);
    return memStore[file] as T;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    useMemory = true;
    if (!(file in memStore)) memStore[file] = clone(fallback);
    return memStore[file] as T;
  }
}

function writeJson(file: string, data: unknown) {
  if (useMemory) {
    memStore[file] = data;
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    useMemory = true;
    memStore[file] = data;
  }
}

function readAll(): Article[] {
  if (useMemory) {
    if (!(DATA_FILE in memStore)) memStore[DATA_FILE] = clone(SEED_ARTICLES);
    return memStore[DATA_FILE] as Article[];
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_ARTICLES, null, 2), "utf-8");
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Article[];
  } catch {
    useMemory = true;
    if (!(DATA_FILE in memStore)) memStore[DATA_FILE] = clone(SEED_ARTICLES);
    return memStore[DATA_FILE] as Article[];
  }
}

function writeAll(articles: Article[]) {
  if (useMemory) {
    memStore[DATA_FILE] = articles;
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), "utf-8");
  } catch {
    useMemory = true;
    memStore[DATA_FILE] = articles;
  }
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// ---- Public (live stories only) ----

export function getPublished(): Article[] {
  const now = Date.now();
  return readAll()
    .filter((a) => isArticleLive(a, now))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBySlug(slug: string): Article | undefined {
  const now = Date.now();
  return readAll().find((a) => a.slug === slug && isArticleLive(a, now));
}

/** Any non-trashed story by slug — used only behind a valid preview token. */
export function getBySlugForPreview(slug: string): Article | undefined {
  return readAll().find((a) => a.slug === slug && !a.deletedAt);
}

export function getBreaking(): Article[] {
  return getPublished().filter((a) => a.isBreaking);
}

export function getFeatured(): Article[] {
  return getPublished().filter((a) => a.isFeatured);
}

export function getByCategory(category: string): Article[] {
  return getPublished().filter((a) => a.category === category);
}

export function getTrending(limit = 5): Article[] {
  return [...getPublished()].sort((a, b) => b.views - a.views).slice(0, limit);
}

export function searchArticles(q: string): Article[] {
  const needle = q.toLowerCase();
  return getPublished().filter(
    (a) =>
      a.title.toLowerCase().includes(needle) ||
      a.excerpt.toLowerCase().includes(needle) ||
      a.body.toLowerCase().includes(needle) ||
      a.tags.some((t) => t.toLowerCase().includes(needle))
  );
}

export function incrementViews(id: string) {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx >= 0) {
    all[idx].views += 1;
    writeAll(all);
    recordViewEvent(id);
  }
}

// ---- Traffic events ----

function recordViewEvent(articleId: string) {
  const events = readJson<ViewEvent[]>(EVENTS_FILE, []);
  events.push({ a: articleId, t: Date.now() });
  writeJson(EVENTS_FILE, events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events);
}

export function getViewEvents(sinceMs?: number): ViewEvent[] {
  const events = readJson<ViewEvent[]>(EVENTS_FILE, []);
  return sinceMs ? events.filter((e) => e.t >= sinceMs) : events;
}

/** Daily totals for the last `days` days, oldest first, including empty days. */
export function getViewsByDay(days = 14): { date: string; label: string; count: number }[] {
  const events = getViewEvents();
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
export function getTrendingByVelocity(hours = 6, limit = 6): TrendingEntry[] {
  const now = Date.now();
  const windowMs = hours * 3600_000;
  const events = getViewEvents(now - windowMs * 2);

  const recent = new Map<string, number>();
  const previous = new Map<string, number>();
  for (const e of events) {
    const m = e.t >= now - windowMs ? recent : previous;
    m.set(e.a, (m.get(e.a) ?? 0) + 1);
  }

  const live = new Map(getPublished().map((a) => [a.id, a]));

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

export function recordEngagement(articleId: string, depth: number, seconds: number) {
  const map = readJson<EngagementMap>(ENGAGEMENT_FILE, {});
  const clampedDepth = Math.max(0, Math.min(100, Math.round(depth)));
  const clampedSeconds = Math.max(0, Math.min(3600, Math.round(seconds)));

  const agg = map[articleId] ?? { samples: 0, depthSum: 0, secondsSum: 0, completed: 0 };
  agg.samples += 1;
  agg.depthSum += clampedDepth;
  agg.secondsSum += clampedSeconds;
  if (clampedDepth >= 90) agg.completed += 1;

  map[articleId] = agg;
  writeJson(ENGAGEMENT_FILE, map);
}

export function getEngagementMap(): EngagementMap {
  return readJson<EngagementMap>(ENGAGEMENT_FILE, {});
}

// ---- Admin (all active articles) ----

export function getAll(): Article[] {
  return readAll()
    .filter((a) => !a.deletedAt)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Trashed stories, newest deletion first. */
export function getTrashed(): Article[] {
  return readAll()
    .filter((a) => a.deletedAt)
    .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

export function getById(id: string): Article | undefined {
  return readAll().find((a) => a.id === id);
}

export function createArticle(
  input: Omit<Article, "id" | "slug" | "views" | "publishedAt" | "updatedAt"> & {
    slug?: string;
  }
): Article {
  const all = readAll();
  const now = new Date().toISOString();
  let slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);
  if (!slug) slug = `story-${Date.now()}`;
  // guarantee unique slug
  let unique = slug;
  let n = 2;
  while (all.some((a) => a.slug === unique)) unique = `${slug}-${n++}`;

  // A scheduled story is dated by when it will go live, so it sorts and reads
  // correctly the moment it appears.
  const publishedAt =
    input.status === "scheduled" && input.scheduledFor ? input.scheduledFor : now;

  const article: Article = {
    ...input,
    id: `a${Date.now()}${Math.floor(Math.random() * 1000)}`,
    slug: unique,
    views: 0,
    publishedAt,
    updatedAt: now,
  };
  all.push(article);
  writeAll(all);
  return article;
}

export function updateArticle(
  id: string,
  patch: Partial<Omit<Article, "id">>
): Article | undefined {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return undefined;
  const current = all[idx];

  if (patch.slug !== undefined) {
    const slug = slugify(patch.slug || current.title) || current.slug;
    let unique = slug;
    let n = 2;
    while (all.some((a) => a.slug === unique && a.id !== id)) unique = `${slug}-${n++}`;
    patch.slug = unique;
  }

  const nextStatus = patch.status ?? current.status;
  const nextSchedule = patch.scheduledFor ?? current.scheduledFor;

  if (nextStatus === "scheduled" && nextSchedule) {
    // Keep the publish date pinned to the moment it will go live.
    patch.publishedAt = nextSchedule;
  } else if (nextStatus === "published") {
    // Publishing outright cancels any schedule, and a future date would sort
    // the story above everything and read as tomorrow's news.
    patch.scheduledFor = undefined;
    const stamped = patch.publishedAt ?? current.publishedAt;
    if (new Date(stamped).getTime() > Date.now()) {
      patch.publishedAt = new Date().toISOString();
    }
  }

  all[idx] = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
  writeAll(all);
  return all[idx];
}

/** Move a story to the trash. Comments are kept so a restore is lossless. */
export function trashArticle(id: string): boolean {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === id && !a.deletedAt);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], deletedAt: new Date().toISOString() };
  writeAll(all);
  return true;
}

export function restoreArticle(id: string): Article | undefined {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === id && a.deletedAt);
  if (idx < 0) return undefined;
  const { deletedAt: _removed, ...rest } = all[idx];
  void _removed;
  all[idx] = rest as Article;
  writeAll(all);
  return all[idx];
}

/** Permanently remove a trashed story and its comments. Not recoverable. */
export function purgeArticle(id: string): boolean {
  const all = readAll();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  writeJson(
    COMMENTS_FILE,
    comments.filter((c) => c.articleId !== id)
  );
  const updates = readJson<LiveUpdate[]>(LIVE_FILE, []);
  writeJson(
    LIVE_FILE,
    updates.filter((u) => u.articleId !== id)
  );
  const engagement = readJson<EngagementMap>(ENGAGEMENT_FILE, {});
  if (id in engagement) {
    delete engagement[id];
    writeJson(ENGAGEMENT_FILE, engagement);
  }
  const revisions = readJson<Revision[]>(REVISIONS_FILE, []);
  writeJson(
    REVISIONS_FILE,
    revisions.filter((r) => r.articleId !== id)
  );
  return true;
}

// ---- Sections ----

/** The live section list, ordered. Falls back to the shipped defaults. */
export function getSections(): Section[] {
  const raw = readJson<Section[] | null>(SECTIONS_FILE, null);
  if (!raw || !Array.isArray(raw) || raw.length === 0) return DEFAULT_SECTIONS;
  return [...raw].sort((a, b) => a.order - b.order);
}

/** How many active stories sit in each section — used to guard deletion. */
export function countArticlesBySection(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of readAll()) {
    if (a.deletedAt) continue;
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }
  return counts;
}

export function createSection(
  label: string,
  color: string
): { ok: true; section: Section } | { ok: false; reason: string } {
  const sections = getSections();
  const slug = slugifySection(label);
  if (!slug) return { ok: false, reason: "That name has no usable letters" };
  if (sections.some((s) => s.slug === slug)) {
    return { ok: false, reason: `A section with the slug "${slug}" already exists` };
  }

  const section: Section = {
    slug,
    label: label.trim().slice(0, 40),
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#71717a",
    order: sections.length,
  };
  writeJson(SECTIONS_FILE, [...sections, section]);
  return { ok: true, section };
}

/** The slug is the public URL, so it never changes — only label, colour, order. */
export function updateSection(
  slug: string,
  patch: { label?: string; color?: string; order?: number }
): Section | undefined {
  const sections = getSections();
  const idx = sections.findIndex((s) => s.slug === slug);
  if (idx < 0) return undefined;

  if (patch.label !== undefined) sections[idx].label = patch.label.trim().slice(0, 40);
  if (patch.color !== undefined && /^#[0-9a-f]{6}$/i.test(patch.color)) {
    sections[idx].color = patch.color;
  }
  if (patch.order !== undefined) sections[idx].order = patch.order;

  writeJson(SECTIONS_FILE, sections);
  return sections[idx];
}

export function reorderSections(slugs: string[]): Section[] {
  const sections = getSections();
  const ranked = new Map(slugs.map((s, i) => [s, i]));
  for (const s of sections) s.order = ranked.get(s.slug) ?? s.order;
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  writeJson(SECTIONS_FILE, sorted);
  return sorted;
}

/**
 * Deleting a section that still holds stories would orphan them, so it is
 * refused. The last section can never be deleted either — an article must
 * always have somewhere to live.
 */
export function deleteSection(slug: string): { ok: true } | { ok: false; reason: string } {
  const sections = getSections();
  if (sections.length <= 1) {
    return { ok: false, reason: "A newsroom needs at least one section" };
  }
  if (!sections.some((s) => s.slug === slug)) {
    return { ok: false, reason: "No such section" };
  }

  const count = countArticlesBySection()[slug] ?? 0;
  if (count > 0) {
    return {
      ok: false,
      reason: `${count} ${count === 1 ? "story is" : "stories are"} still filed under this section. Move them first.`,
    };
  }

  writeJson(
    SECTIONS_FILE,
    sections.filter((s) => s.slug !== slug)
  );
  return { ok: true };
}

// ---- Corrections ----

/** Corrections are appended, never edited — that is the whole point of them. */
export function addCorrection(
  articleId: string,
  note: string,
  editorName: string
): Article | undefined {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === articleId);
  if (idx < 0) return undefined;

  const correction: Correction = {
    id: `x${Date.now()}${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString(),
    note: note.trim().slice(0, 1000),
    editorName,
  };
  all[idx] = {
    ...all[idx],
    corrections: [...(all[idx].corrections ?? []), correction],
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
  return all[idx];
}

export function deleteCorrection(articleId: string, correctionId: string): Article | undefined {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === articleId);
  if (idx < 0) return undefined;
  all[idx] = {
    ...all[idx],
    corrections: (all[idx].corrections ?? []).filter((c) => c.id !== correctionId),
  };
  writeAll(all);
  return all[idx];
}

// ---- Revision history ----

/** Deep enough to walk back a bad day, shallow enough not to grow forever. */
const MAX_REVISIONS_PER_ARTICLE = 20;

/** True when a patch touches anything worth remembering. */
export function touchesContent(
  current: Article,
  patch: Partial<Omit<Article, "id">>
): boolean {
  return REVISIONED_FIELDS.some((field) => {
    if (patch[field] === undefined) return false;
    const a = patch[field];
    const b = current[field];
    if (Array.isArray(a) && Array.isArray(b)) return a.join(" ") !== b.join(" ");
    return a !== b;
  });
}

/** Snapshot the article as it stands, before an edit overwrites it. */
export function addRevision(
  article: Article,
  editor: { id: string; name: string } | null
): Revision {
  const all = readJson<Revision[]>(REVISIONS_FILE, []);
  const revision: Revision = {
    id: `r${Date.now()}${Math.floor(Math.random() * 1000)}`,
    articleId: article.id,
    at: new Date().toISOString(),
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
  };
  all.push(revision);

  // Trim this article's history only — other articles keep theirs.
  const mine = all
    .filter((r) => r.articleId === article.id)
    .sort((a, b) => b.at.localeCompare(a.at));
  const keep = new Set(mine.slice(0, MAX_REVISIONS_PER_ARTICLE).map((r) => r.id));
  writeJson(
    REVISIONS_FILE,
    all.filter((r) => r.articleId !== article.id || keep.has(r.id))
  );
  return revision;
}

export function getRevisions(articleId: string): Revision[] {
  return readJson<Revision[]>(REVISIONS_FILE, [])
    .filter((r) => r.articleId === articleId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function getRevisionById(id: string): Revision | undefined {
  return readJson<Revision[]>(REVISIONS_FILE, []).find((r) => r.id === id);
}

// ---- Live blog updates ----

/** Newest first — a live blog reads top-down like a wire feed. */
export function getLiveUpdates(articleId: string): LiveUpdate[] {
  return readJson<LiveUpdate[]>(LIVE_FILE, [])
    .filter((u) => u.articleId === articleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countLiveUpdates(articleId: string): number {
  return readJson<LiveUpdate[]>(LIVE_FILE, []).filter((u) => u.articleId === articleId)
    .length;
}

export function addLiveUpdate(
  articleId: string,
  body: string,
  editor: { id: string; name: string },
  isKey = false
): LiveUpdate {
  const updates = readJson<LiveUpdate[]>(LIVE_FILE, []);
  const update: LiveUpdate = {
    id: `u${Date.now()}${Math.floor(Math.random() * 1000)}`,
    articleId,
    body: body.slice(0, 5000),
    isKey,
    editorId: editor.id,
    editorName: editor.name,
    createdAt: new Date().toISOString(),
  };
  updates.push(update);
  writeJson(LIVE_FILE, updates);
  return update;
}

export function getLiveUpdateById(id: string): LiveUpdate | undefined {
  return readJson<LiveUpdate[]>(LIVE_FILE, []).find((u) => u.id === id);
}

export function setLiveUpdateKey(id: string, isKey: boolean): LiveUpdate | undefined {
  const updates = readJson<LiveUpdate[]>(LIVE_FILE, []);
  const idx = updates.findIndex((u) => u.id === id);
  if (idx < 0) return undefined;
  updates[idx].isKey = isKey;
  writeJson(LIVE_FILE, updates);
  return updates[idx];
}

export function deleteLiveUpdate(id: string): boolean {
  const updates = readJson<LiveUpdate[]>(LIVE_FILE, []);
  const next = updates.filter((u) => u.id !== id);
  if (next.length === updates.length) return false;
  writeJson(LIVE_FILE, next);
  return true;
}

// ---- Media library ----

/**
 * The uploads directory is the source of truth for *what exists*; media.json
 * only carries the extras (alt text, who uploaded it). That way a file dropped
 * in by hand still shows up, and a stale record never points at nothing.
 */
export function getMediaItems(): MediaItem[] {
  let files: string[] = [];
  try {
    files = fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR) : [];
  } catch {
    return [];
  }

  const meta = readJson<Record<string, Partial<MediaItem>>>(MEDIA_FILE, {});

  return files
    .filter((f) => !f.startsWith(".") && /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
    .map((filename) => {
      let size = 0;
      let mtime = new Date();
      try {
        const st = fs.statSync(path.join(UPLOAD_DIR, filename));
        size = st.size;
        mtime = st.mtime;
      } catch {
        /* file vanished between readdir and stat */
      }
      const m = meta[filename] ?? {};
      return {
        filename,
        url: `/uploads/${filename}`,
        size: m.size ?? size,
        alt: m.alt,
        uploadedBy: m.uploadedBy,
        createdAt: m.createdAt ?? mtime.toISOString(),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordMedia(item: MediaItem) {
  const meta = readJson<Record<string, Partial<MediaItem>>>(MEDIA_FILE, {});
  meta[item.filename] = item;
  writeJson(MEDIA_FILE, meta);
}

export function setMediaAlt(filename: string, alt: string): boolean {
  const meta = readJson<Record<string, Partial<MediaItem>>>(MEDIA_FILE, {});
  meta[filename] = { ...(meta[filename] ?? {}), alt: alt.slice(0, 300) };
  writeJson(MEDIA_FILE, meta);
  return true;
}

/** Which live/active stories reference this image, as a hero or inline. */
export function getMediaUsage(url: string): { id: string; title: string }[] {
  return readAll()
    .filter((a) => !a.deletedAt)
    .filter((a) => a.imageUrl === url || a.body.includes(url))
    .map((a) => ({ id: a.id, title: a.title }));
}

export function getMediaWithUsage(): MediaItemWithUsage[] {
  return getMediaItems().map((m) => ({ ...m, usedBy: getMediaUsage(m.url) }));
}

export function deleteMediaFile(filename: string): boolean {
  // Never let a traversal escape the uploads directory.
  const safe = path.basename(filename);
  const target = path.join(UPLOAD_DIR, safe);
  if (!target.startsWith(UPLOAD_DIR)) return false;

  try {
    if (!fs.existsSync(target)) return false;
    fs.unlinkSync(target);
  } catch {
    return false;
  }

  const meta = readJson<Record<string, Partial<MediaItem>>>(MEDIA_FILE, {});
  delete meta[safe];
  writeJson(MEDIA_FILE, meta);
  return true;
}

// ---- Homepage curation ----

export function getCuration(): Curation | null {
  const c = readJson<Curation | null>(CURATION_FILE, null);
  return c && Array.isArray(c.topStoryIds) ? c : null;
}

export function setCuration(
  heroId: string | undefined,
  topStoryIds: string[],
  updatedBy?: string
): Curation {
  const curation: Curation = {
    heroId: heroId || undefined,
    topStoryIds: topStoryIds.slice(0, 8),
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  writeJson(CURATION_FILE, curation);
  return curation;
}

export function clearCuration() {
  writeJson(CURATION_FILE, null);
}

/**
 * The front page, honouring manual curation but never trusting it blindly:
 * a curated story that has since been unpublished or trashed simply drops out
 * and the automatic pick fills the gap.
 */
export function getHomepage(): {
  hero?: Article;
  topStories: Article[];
  latest: Article[];
  isCurated: boolean;
} {
  const published = getPublished();
  if (published.length === 0) {
    return { topStories: [], latest: [], isCurated: false };
  }

  const curation = getCuration();
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

export function logActivity(event: Omit<ActivityEvent, "id" | "at">): ActivityEvent {
  const events = readJson<ActivityEvent[]>(ACTIVITY_FILE, []);
  const entry: ActivityEvent = {
    ...event,
    id: `e${Date.now()}${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString(),
  };
  events.push(entry);
  // Keep the log bounded — this is a newsroom feed, not an archive.
  writeJson(ACTIVITY_FILE, events.slice(-500));
  return entry;
}

export function getActivity(limit = 100): ActivityEvent[] {
  return readJson<ActivityEvent[]>(ACTIVITY_FILE, [])
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

/** Convenience wrapper so callers don't repeat the action-name strings. */
export function recordArticleAction(
  action: ActivityAction,
  editor: { id: string; name: string } | null,
  article: { id: string; title: string },
  detail?: string
) {
  logActivity({
    action,
    editorId: editor?.id,
    editorName: editor?.name ?? "Someone",
    target: article.title,
    targetId: article.id,
    detail,
  });
}

// ---- Comments ----

export function getApprovedComments(articleId: string): Comment[] {
  return readJson<Comment[]>(COMMENTS_FILE, [])
    .filter((c) => c.articleId === articleId && c.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Approved top-level comments, each carrying its approved replies oldest-first
 * (a conversation reads forwards, even though the threads themselves are
 * newest-first).
 */
export function getCommentThreads(articleId: string): CommentThread[] {
  const approved = getApprovedComments(articleId);
  const tops = approved.filter((c) => !c.parentId);
  return tops.map((top) => ({
    ...top,
    replies: approved
      .filter((c) => c.parentId === top.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}

export function getAllComments(): Comment[] {
  return readJson<Comment[]>(COMMENTS_FILE, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getCommentById(id: string): Comment | undefined {
  return readJson<Comment[]>(COMMENTS_FILE, []).find((c) => c.id === id);
}

export function countPendingComments(): number {
  return readJson<Comment[]>(COMMENTS_FILE, []).filter((c) => c.status === "pending")
    .length;
}

export function countSpamComments(): number {
  return readJson<Comment[]>(COMMENTS_FILE, []).filter((c) => c.status === "spam").length;
}

/** A reader comment. Blocked words send it straight to the spam tray. */
export function addComment(articleId: string, name: string, text: string): Comment {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const settings = getModerationSettings();
  const comment: Comment = {
    id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`,
    articleId,
    name: name.slice(0, 60),
    text: text.slice(0, 2000),
    status: looksLikeSpam(name, text, settings) ? "spam" : "pending",
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  writeJson(COMMENTS_FILE, comments);
  return comment;
}

/** An official newsroom response. Published immediately — an editor is trusted. */
export function addEditorReply(
  parentId: string,
  text: string,
  editor: { id: string; name: string }
): Comment | undefined {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const parent = comments.find((c) => c.id === parentId);
  if (!parent) return undefined;

  const reply: Comment = {
    id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`,
    articleId: parent.articleId,
    name: editor.name,
    text: text.slice(0, 2000),
    status: "approved",
    parentId,
    isEditorReply: true,
    editorId: editor.id,
    createdAt: new Date().toISOString(),
  };
  comments.push(reply);
  writeJson(COMMENTS_FILE, comments);
  return reply;
}

export function setCommentStatus(
  id: string,
  status: CommentStatus
): Comment | undefined {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const idx = comments.findIndex((c) => c.id === id);
  if (idx < 0) return undefined;
  comments[idx].status = status;
  writeJson(COMMENTS_FILE, comments);
  return comments[idx];
}

/** Deleting a comment takes its replies with it — an orphan reply is nonsense. */
export function deleteComment(id: string): boolean {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const next = comments.filter((c) => c.id !== id && c.parentId !== id);
  if (next.length === comments.length) return false;
  writeJson(COMMENTS_FILE, next);
  return true;
}

/** Apply one action across many comments in a single write. */
export function bulkComments(
  ids: string[],
  action: CommentBulkAction
): { updated: number } {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const target = new Set(ids);

  if (action === "delete") {
    const next = comments.filter((c) => !target.has(c.id) && !target.has(c.parentId ?? ""));
    writeJson(COMMENTS_FILE, next);
    return { updated: comments.length - next.length };
  }

  let updated = 0;
  for (const c of comments) {
    if (target.has(c.id)) {
      c.status = action === "approve" ? "approved" : "spam";
      updated++;
    }
  }
  writeJson(COMMENTS_FILE, comments);
  return { updated };
}

// ---- Moderation settings ----

export function getModerationSettings(): ModerationSettings {
  const raw = readJson<ModerationSettings | null>(MODERATION_FILE, null);
  if (!raw || !Array.isArray(raw.blockedTerms) || !Array.isArray(raw.blockedNames)) {
    return DEFAULT_MODERATION;
  }
  return raw;
}

export function setModerationSettings(settings: ModerationSettings): ModerationSettings {
  const clean: ModerationSettings = {
    blockedTerms: settings.blockedTerms.map((t) => t.trim()).filter(Boolean).slice(0, 200),
    blockedNames: settings.blockedNames.map((n) => n.trim()).filter(Boolean).slice(0, 200),
  };
  writeJson(MODERATION_FILE, clean);
  return clean;
}

// ---- Newsletter subscribers ----

export function getSubscribers(): Subscriber[] {
  return readJson<Subscriber[]>(SUBSCRIBERS_FILE, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function addSubscriber(email: string): { ok: boolean; reason?: string } {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, reason: "Please enter a valid email address" };
  }
  const subs = readJson<Subscriber[]>(SUBSCRIBERS_FILE, []);
  if (subs.some((s) => s.email === clean)) {
    return { ok: false, reason: "You are already subscribed" };
  }
  subs.push({ email: clean, createdAt: new Date().toISOString() });
  writeJson(SUBSCRIBERS_FILE, subs);
  return { ok: true };
}

export function removeSubscriber(email: string): boolean {
  const subs = readJson<Subscriber[]>(SUBSCRIBERS_FILE, []);
  const next = subs.filter((s) => s.email !== email.trim().toLowerCase());
  if (next.length === subs.length) return false;
  writeJson(SUBSCRIBERS_FILE, next);
  return true;
}

// ---- Editors (accounts) ----
//
// Seeded with a bootstrap admin so the newsroom is never locked out. Editors
// added here persist to data/editors.json locally; on Vercel's read-only FS the
// store falls back to the seed on each cold start (same caveat as articles).

function readEditors(): Editor[] {
  // Clone the seed: on a writable FS readJson hands back the fallback *by
  // reference* when the file is missing, and callers push/mutate the result.
  return readJson<Editor[]>(EDITORS_FILE, clone(SEED_EDITORS));
}

export function getEditors(): Editor[] {
  return readEditors().sort((a, b) => a.name.localeCompare(b.name));
}

/** Credential-free list, safe to hand to client components. */
export function getPublicEditors(): PublicEditor[] {
  return getEditors().map(toPublicEditor);
}

export function getEditorById(id: string): Editor | undefined {
  return readEditors().find((e) => e.id === id);
}

export function getEditorByUsername(username: string): Editor | undefined {
  const handle = username.trim().toLowerCase();
  return readEditors().find((e) => e.username === handle);
}

export type EditorResult =
  | { ok: true; editor: Editor }
  | { ok: false; reason: string };

export function createEditor(input: {
  name: string;
  username: string;
  password: string;
  photoUrl?: string;
  title?: string;
  role?: EditorRole;
}): EditorResult {
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

  const all = readEditors();
  if (all.some((e) => e.username === username)) {
    return { ok: false, reason: "That username is already taken" };
  }

  const editor: Editor = {
    id: `ed${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    username,
    passwordHash: hashPassword(password),
    photoUrl: input.photoUrl?.trim() || undefined,
    title: input.title?.trim() || undefined,
    role: input.role === "admin" ? "admin" : "editor",
    createdAt: new Date().toISOString(),
  };
  all.push(editor);
  writeJson(EDITORS_FILE, all);
  return { ok: true, editor };
}

export function updateEditor(
  id: string,
  patch: {
    name?: string;
    username?: string;
    password?: string;
    photoUrl?: string;
    title?: string;
    role?: EditorRole;
  }
): EditorResult {
  const all = readEditors();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return { ok: false, reason: "Editor not found" };
  const current = all[idx];
  const next: Editor = { ...current };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name.length < 2) return { ok: false, reason: "Name is too short" };
    next.name = name;
  }
  if (patch.username !== undefined) {
    const username = patch.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      return { ok: false, reason: "Invalid username" };
    }
    if (all.some((e) => e.username === username && e.id !== id)) {
      return { ok: false, reason: "That username is already taken" };
    }
    next.username = username;
  }
  if (patch.password) {
    if (patch.password.length < 6) {
      return { ok: false, reason: "Password must be at least 6 characters" };
    }
    next.passwordHash = hashPassword(patch.password);
  }
  if (patch.photoUrl !== undefined) next.photoUrl = patch.photoUrl.trim() || undefined;
  if (patch.title !== undefined) next.title = patch.title.trim() || undefined;

  if (patch.role !== undefined && patch.role !== current.role) {
    // Never demote the last remaining admin — that would lock everyone out.
    if (current.role === "admin" && all.filter((e) => e.role === "admin").length === 1) {
      return { ok: false, reason: "This is the only admin — promote someone else first" };
    }
    next.role = patch.role;
  }

  all[idx] = next;
  writeJson(EDITORS_FILE, all);
  return { ok: true, editor: next };
}

export function deleteEditor(id: string): { ok: boolean; reason?: string } {
  const all = readEditors();
  const target = all.find((e) => e.id === id);
  if (!target) return { ok: false, reason: "Editor not found" };
  if (target.role === "admin" && all.filter((e) => e.role === "admin").length === 1) {
    return { ok: false, reason: "Can't remove the only admin" };
  }
  writeJson(
    EDITORS_FILE,
    all.filter((e) => e.id !== id)
  );
  // Their articles stay published; the byline keeps the stored author name.
  return { ok: true };
}

/** True when this article belongs to the given editor (id link, or legacy name match). */
export function isAuthoredBy(article: Article, editor: Editor | PublicEditor): boolean {
  if (article.authorId) return article.authorId === editor.id;
  return article.author.trim().toLowerCase() === editor.name.trim().toLowerCase();
}

/** The editor account behind an article's byline, if one exists. */
export function getEditorForArticle(article: Article): PublicEditor | undefined {
  const match = readEditors().find((e) => isAuthoredBy(article, e));
  return match ? toPublicEditor(match) : undefined;
}

/** Per-editor performance, sorted by total views. Powers the analytics board. */
export function getEditorStats(): EditorStats[] {
  const articles = readAll().filter((a) => !a.deletedAt);
  return getEditors()
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
