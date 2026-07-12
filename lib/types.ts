/** A section slug. Sections are data now, so this is an open string. */
export type Category = string;

/** A newsroom section, editable from /admin/sections. */
export interface Section {
  slug: string; // immutable once created — it is the public URL
  label: string;
  color: string;
  order: number;
}

/** Shipped defaults, and the fallback whenever the store has nothing. */
export const DEFAULT_SECTIONS: Section[] = [
  { slug: "world", label: "World", color: "#b91c1c", order: 0 },
  { slug: "politics", label: "Politics", color: "#1d4ed8", order: 1 },
  { slug: "business", label: "Business", color: "#047857", order: 2 },
  { slug: "technology", label: "Technology", color: "#6d28d9", order: 3 },
  { slug: "sports", label: "Sports", color: "#c2410c", order: 4 },
  { slug: "health", label: "Health", color: "#0e7490", order: 5 },
  { slug: "entertainment", label: "Entertainment", color: "#be185d", order: 6 },
];

/** Kept for the seed data, which is written against the shipped sections. */
export const CATEGORIES = DEFAULT_SECTIONS;

/**
 * Look up a section's label and colour. Server code passes the live list;
 * anything that can't reach the store falls back to the shipped defaults, so
 * a badge never renders blank.
 */
export function categoryMeta(
  slug: string,
  sections: Section[] = DEFAULT_SECTIONS
): Section {
  return (
    sections.find((c) => c.slug === slug) ?? {
      slug,
      label: slug ? slug[0].toUpperCase() + slug.slice(1) : "News",
      color: "#71717a",
      order: 999,
    }
  );
}

export function slugifySection(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 32);
}

/** A Ghana Newspapers TV video. youtubeId is optional — a styled placeholder stands in without it. */
export interface Video {
  id: string;
  title: string;
  show: string; // playlist / programme, e.g. "Ghana Newspapers", "The Big Interview"
  youtubeId?: string;
  duration: string; // "12:04"
  views: number;
  publishedAt: string; // ISO
  featured?: boolean;
}

/** Ghana Newspapers TV programmes, in the order they appear as filter chips. */
export const VIDEO_SHOWS = [
  "Ghana Newspapers",
  "The Big Interview",
  "BizTech",
  "SportsZone",
  "Entertainment Now",
  "Everyday People",
] as const;

export function videoThumb(v: Video): string | null {
  return v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : null;
}

/** Pulls an 11-char YouTube video id out of a watch/shorts/share URL, or a bare id. */
export function youtubeId(raw: string): string | null {
  const s = raw.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(s);
  return m ? m[1] : null;
}

/** A tile in the Resources hub — a service/tool, not a news story. */
export interface ResourceLink {
  id: string;
  title: string;
  description: string;
  href: string; // internal route or external URL
  icon: ResourceIcon;
  group: string; // section heading it's grouped under
  external?: boolean;
}

export type ResourceIcon =
  | "currency"
  | "dictionary"
  | "business"
  | "jobs"
  | "classifieds"
  | "photos"
  | "radio"
  | "map"
  | "weather"
  | "events";

export const RESOURCE_GROUPS = ["Tools", "Directory", "Media", "Community"] as const;

/** A published correction appended to a story, in the open. */
export interface Correction {
  id: string;
  at: string; // ISO
  note: string;
  editorName: string;
}

/** Combined byline, e.g. "By Kwame Mensah", "By A and B", "By A, B and C". */
export function formatByline(author: string, coAuthors?: string[]): string {
  const names = [author, ...(coAuthors ?? [])]
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length === 0) return "By Newsroom";
  if (names.length === 1) return `By ${names[0]}`;
  if (names.length === 2) return `By ${names[0]} and ${names[1]}`;
  return `By ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export type CommentStatus = "pending" | "approved" | "spam";

export interface Comment {
  id: string;
  articleId: string;
  name: string;
  text: string;
  status: CommentStatus;
  parentId?: string; // set when this is a reply
  isEditorReply?: boolean; // an official newsroom response
  editorId?: string;
  createdAt: string; // ISO
}

/** A top-level comment with its approved replies attached. */
export interface CommentThread extends Comment {
  replies: Comment[];
}

export type CommentBulkAction = "approve" | "spam" | "delete";

/** Word filters that quarantine a comment on arrival. */
export interface ModerationSettings {
  blockedTerms: string[]; // matched anywhere in the body
  blockedNames: string[]; // matched against the commenter's name
}

export const DEFAULT_MODERATION: ModerationSettings = {
  blockedTerms: [],
  blockedNames: [],
};

/** Case-insensitive substring match against either list. */
export function looksLikeSpam(
  name: string,
  text: string,
  settings: ModerationSettings
): boolean {
  const haystack = text.toLowerCase();
  const who = name.toLowerCase();
  return (
    settings.blockedTerms.some((t) => t.trim() && haystack.includes(t.trim().toLowerCase())) ||
    settings.blockedNames.some((n) => n.trim() && who.includes(n.trim().toLowerCase()))
  );
}

export interface Subscriber {
  email: string;
  createdAt: string; // ISO
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // paragraphs separated by blank lines
  category: Category;
  author: string; // lead editor / writer (display name; legacy seed articles have no account)
  authorId?: string; // links to an Editor account → byline photo + analytics
  coAuthors?: string[]; // additional editors who wrote the story
  imageUrl?: string;
  metaDescription?: string; // search/social description; falls back to excerpt
  tags: string[];
  status: ArticleStatus;
  scheduledFor?: string; // ISO — when a "scheduled" story goes live
  deletedAt?: string; // ISO — set when trashed; absent means active
  isBreaking: boolean;
  isFeatured: boolean;
  isLiveBlog?: boolean; // rolling, timestamped updates instead of a static story
  corrections?: Correction[]; // appended publicly, never rewritten silently
  rating: number; // editorial quality rating, 0–5 (0 = unrated)
  views: number;
  publishedAt: string; // ISO
  updatedAt: string; // ISO
}

/** One rolling entry on a live blog, newest shown first. */
export interface LiveUpdate {
  id: string;
  articleId: string;
  body: string;
  isKey?: boolean; // highlighted as a key development
  editorId?: string;
  editorName: string;
  createdAt: string; // ISO
}

/**
 * A snapshot of a story's content taken *before* an edit lands, so any save
 * can be walked back. Only content fields are captured — flag toggles
 * (breaking, featured, rating) don't deserve a revision.
 */
export interface Revision {
  id: string;
  articleId: string;
  at: string; // ISO
  editorId?: string;
  editorName: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: Category;
  tags: string[];
  imageUrl?: string;
  metaDescription?: string;
}

/** The fields whose change is worth remembering. */
export const REVISIONED_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "body",
  "category",
  "tags",
  "imageUrl",
  "metaDescription",
] as const;

export type BulkAction =
  | "publish"
  | "unpublish"
  | "trash"
  | "feature"
  | "unfeature";

/** A single page view, kept compact — there are a lot of these. */
export interface ViewEvent {
  a: string; // articleId
  t: number; // epoch ms
}

/** How far readers get through a story, aggregated (never per-reader). */
export interface EngagementAgg {
  samples: number;
  depthSum: number; // sum of max scroll depth, 0–100
  secondsSum: number;
  completed: number; // readers reaching >= 90%
}

export type EngagementMap = Record<string, EngagementAgg>;

export interface TrendingEntry {
  article: Article;
  recent: number; // views inside the window
  previous: number; // views in the window before it
  velocity: number; // views per hour, this window
  change: number | null; // % change vs previous window; null when previous was 0
}

/** An uploaded image. The filename is the id — it is already unique. */
export interface MediaItem {
  filename: string;
  url: string; // /uploads/<filename>
  size: number; // bytes
  alt?: string;
  uploadedBy?: string;
  createdAt: string; // ISO
}

/** A media item plus where it is currently used. */
export interface MediaItemWithUsage extends MediaItem {
  usedBy: { id: string; title: string }[];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Manual homepage arrangement. Anything left unset falls back to the
 * automatic ordering, so a half-filled board never empties the front page.
 */
export interface Curation {
  heroId?: string;
  topStoryIds: string[]; // ordered
  updatedAt: string; // ISO
  updatedBy?: string;
}

export type ArticleStatus = "published" | "draft" | "scheduled";

/**
 * Whether readers can see this story right now. A scheduled story becomes
 * live the moment its time passes — no cron job needed, because every public
 * page is rendered on demand.
 */
export function isArticleLive(a: Article, now: number = Date.now()): boolean {
  if (a.deletedAt) return false;
  if (a.status === "published") return true;
  if (a.status === "scheduled" && a.scheduledFor) {
    return new Date(a.scheduledFor).getTime() <= now;
  }
  return false;
}

/** What the status *reads as* today — a scheduled story past its time is published. */
export function effectiveStatus(a: Article, now: number = Date.now()): ArticleStatus {
  if (a.status === "scheduled" && a.scheduledFor) {
    return new Date(a.scheduledFor).getTime() <= now ? "published" : "scheduled";
  }
  return a.status;
}

/** Human countdown for a pending scheduled story, e.g. "in 3h 20m". */
export function timeUntil(iso: string, now: number = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h ${mins % 60}m`;
  return `in ${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export type ActivityAction =
  | "article.created"
  | "article.updated"
  | "article.published"
  | "article.unpublished"
  | "article.scheduled"
  | "article.trashed"
  | "article.restored"
  | "article.purged"
  | "comment.approved"
  | "comment.deleted"
  | "editor.added"
  | "editor.updated"
  | "editor.removed"
  | "live.posted"
  | "live.deleted"
  | "homepage.curated"
  | "homepage.reset";

export interface ActivityEvent {
  id: string;
  at: string; // ISO
  editorId?: string;
  editorName: string;
  action: ActivityAction;
  target: string; // human-readable subject, e.g. the headline
  targetId?: string;
  detail?: string;
}

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  "article.created": "created",
  "article.updated": "updated",
  "article.published": "published",
  "article.unpublished": "unpublished",
  "article.scheduled": "scheduled",
  "article.trashed": "moved to trash",
  "article.restored": "restored",
  "article.purged": "permanently deleted",
  "comment.approved": "approved a comment on",
  "comment.deleted": "deleted a comment on",
  "editor.added": "added editor",
  "editor.updated": "updated editor",
  "editor.removed": "removed editor",
  "live.posted": "posted a live update on",
  "live.deleted": "removed a live update from",
  "homepage.curated": "rearranged",
  "homepage.reset": "reset",
};

/** "admin" manages editor accounts and every article; "editor" owns only their own. */
export type EditorRole = "admin" | "editor";

export interface Editor {
  id: string;
  name: string; // display name used on the byline
  username: string; // login handle, stored lowercase
  passwordHash: string; // "salt:hash" — never leaves the server
  photoUrl?: string; // byline / analytics avatar
  title?: string; // e.g. "Politics Desk"
  bio?: string; // one or two sentences, shown on their author page
  role: EditorRole;
  createdAt: string; // ISO
}

/** An Editor with the credential stripped — safe to pass to client components. */
export type PublicEditor = Omit<Editor, "passwordHash">;

export function toPublicEditor(e: Editor): PublicEditor {
  // Drop the credential — this shape is what reaches client components.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = e;
  return rest;
}

/** Per-editor performance, shown on the analytics board. */
export interface EditorStats {
  editor: PublicEditor;
  published: number;
  drafts: number;
  totalViews: number;
  avgRating: number; // 0 when nothing is rated
  breaking: number;
}

/** Initials fallback when an editor has no photo. */
export function editorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
