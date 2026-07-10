export type Category =
  | "world"
  | "politics"
  | "business"
  | "technology"
  | "sports"
  | "health"
  | "entertainment";

export const CATEGORIES: { slug: Category; label: string; color: string }[] = [
  { slug: "world", label: "World", color: "#b91c1c" },
  { slug: "politics", label: "Politics", color: "#1d4ed8" },
  { slug: "business", label: "Business", color: "#047857" },
  { slug: "technology", label: "Technology", color: "#6d28d9" },
  { slug: "sports", label: "Sports", color: "#c2410c" },
  { slug: "health", label: "Health", color: "#0e7490" },
  { slug: "entertainment", label: "Entertainment", color: "#be185d" },
];

export function categoryMeta(slug: string) {
  return (
    CATEGORIES.find((c) => c.slug === slug) ?? {
      slug: "world" as Category,
      label: "News",
      color: "#b91c1c",
    }
  );
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

export interface Comment {
  id: string;
  articleId: string;
  name: string;
  text: string;
  status: "pending" | "approved";
  createdAt: string; // ISO
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
  tags: string[];
  status: ArticleStatus;
  scheduledFor?: string; // ISO — when a "scheduled" story goes live
  deletedAt?: string; // ISO — set when trashed; absent means active
  isBreaking: boolean;
  isFeatured: boolean;
  rating: number; // editorial quality rating, 0–5 (0 = unrated)
  views: number;
  publishedAt: string; // ISO
  updatedAt: string; // ISO
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
  | "editor.removed";

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
