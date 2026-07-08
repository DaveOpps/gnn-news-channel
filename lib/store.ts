import fs from "fs";
import path from "path";
import { Article, Comment, Subscriber } from "./types";
import { SEED_ARTICLES } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "articles.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

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

// ---- Public (published only) ----

export function getPublished(): Article[] {
  return readAll()
    .filter((a) => a.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBySlug(slug: string): Article | undefined {
  return readAll().find((a) => a.slug === slug && a.status === "published");
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
  }
}

// ---- Admin (all articles) ----

export function getAll(): Article[] {
  return readAll().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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

  const article: Article = {
    ...input,
    id: `a${Date.now()}${Math.floor(Math.random() * 1000)}`,
    slug: unique,
    views: 0,
    publishedAt: now,
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
    let slug = slugify(patch.slug || current.title) || current.slug;
    let unique = slug;
    let n = 2;
    while (all.some((a) => a.slug === unique && a.id !== id)) unique = `${slug}-${n++}`;
    patch.slug = unique;
  }

  all[idx] = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
  writeAll(all);
  return all[idx];
}

export function deleteArticle(id: string): boolean {
  const all = readAll();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  // clean up this article's comments too
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  writeJson(
    COMMENTS_FILE,
    comments.filter((c) => c.articleId !== id)
  );
  return true;
}

// ---- Comments ----

export function getApprovedComments(articleId: string): Comment[] {
  return readJson<Comment[]>(COMMENTS_FILE, [])
    .filter((c) => c.articleId === articleId && c.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAllComments(): Comment[] {
  return readJson<Comment[]>(COMMENTS_FILE, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function countPendingComments(): number {
  return readJson<Comment[]>(COMMENTS_FILE, []).filter((c) => c.status === "pending")
    .length;
}

export function addComment(articleId: string, name: string, text: string): Comment {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const comment: Comment = {
    id: `c${Date.now()}${Math.floor(Math.random() * 1000)}`,
    articleId,
    name: name.slice(0, 60),
    text: text.slice(0, 2000),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  writeJson(COMMENTS_FILE, comments);
  return comment;
}

export function setCommentStatus(
  id: string,
  status: "pending" | "approved"
): Comment | undefined {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const idx = comments.findIndex((c) => c.id === id);
  if (idx < 0) return undefined;
  comments[idx].status = status;
  writeJson(COMMENTS_FILE, comments);
  return comments[idx];
}

export function deleteComment(id: string): boolean {
  const comments = readJson<Comment[]>(COMMENTS_FILE, []);
  const next = comments.filter((c) => c.id !== id);
  if (next.length === comments.length) return false;
  writeJson(COMMENTS_FILE, next);
  return true;
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
