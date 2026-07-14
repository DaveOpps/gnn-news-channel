/**
 * GH Newspapers → GNN News Channel migration script
 *
 * Fetches articles DIRECTLY from the live GH Newspapers API — no file export needed.
 *
 * Run:
 *   npx tsx scripts/migrate-ghn.ts
 *
 * Articles that already exist (same slug/id) are skipped — safe to re-run.
 */

import "dotenv/config";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../lib/generated/prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaNeon } = require("@prisma/adapter-neon");

const GHN_BASE = "https://ghananewspapers.com";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

/* ── Category mapping ──────────────────────────────────────────── */
const CAT_MAP: Record<string, string> = {
  news:          "world",
  politics:      "politics",
  business:      "business",
  sports:        "sports",
  entertainment: "entertainment",
  technology:    "technology",
  tech:          "technology",
  health:        "health",
  opinion:       "politics",
  society:       "world",
  world:         "world",
  regions:       "world",
  archives:      "world",
};

function mapCategory(cat: string): string {
  return CAT_MAP[(cat || "").toLowerCase()] ?? "world";
}

/* ── Helpers to read WP-style { rendered } or plain string ─────── */
function rendered(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && "rendered" in (field as object)) {
    return String((field as { rendered: unknown }).rendered ?? "");
  }
  return "";
}

/* ── Strip HTML → plain-text paragraphs (blank-line separated) ── */
function htmlToBody(html: string): string {
  if (!html) return "";
  const t = html
    .replace(/<\/p>/gi,          "\n\n")
    .replace(/<\/h[1-6]>/gi,     "\n\n")
    .replace(/<\/li>/gi,         "\n")
    .replace(/<br\s*\/?>/gi,     "\n")
    .replace(/<\/div>/gi,        "\n")
    .replace(/<\/blockquote>/gi, "\n\n")
    .replace(/<[^>]+>/g,         "")
    .replace(/&amp;/g,   "&")
    .replace(/&lt;/g,    "<")
    .replace(/&gt;/g,    ">")
    .replace(/&quot;/g,  '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g,  "'")
    .replace(/&nbsp;/g,  " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g,"…");
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[,\n|;]+/).map((t) => t.trim()).filter(Boolean);
}

/* ── Build a safe, clean, unique slug ──────────────────────────
   Some old rows have a malformed slug (raw HTML/title text, thousands
   of chars) that blows past Postgres's btree index limit. Sanitize:
   strip HTML/entities, lowercase-hyphenate, and cap length. If the
   original slug is unusable, derive one from the title + GHN id so it
   stays unique and deterministic across re-runs. */
function cleanSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")        // strip HTML tags
    .replace(/&[a-z0-9#]+;/gi, "")  // strip HTML entities
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeSlug(rawSlug: string, title: string, ghnId: number): string {
  const original = cleanSlug(rawSlug);
  // Keep the original slug when it's clean and a sensible length
  if (original && original.length <= 90) return original;
  // Otherwise derive from the title, capped, with the id for uniqueness
  const base = cleanSlug(title).slice(0, 60).replace(/-+$/, "");
  return `${base || "article"}-ghn${ghnId}`;
}

/* ── Types ─────────────────────────────────────────────────────── */
interface GhnListItem {
  id:            number;
  slug:          string;
  title:         unknown;
  excerpt:       unknown;
  category:      string;
  author:        string;
  imageUrl?:     string;
  image_url?:    string;
  status:        string;
  views:         number;
  date?:         string;
  published_at?: string;
  created_at?:   string;
  scheduled_at?: string;
}

interface GhnFull extends GhnListItem {
  content:  unknown;
  tags?:    string;
}

/* ── Fetch the full article list (endpoint returns ALL at once) ── */
async function fetchList(): Promise<GhnListItem[]> {
  const url = `${GHN_BASE}/api/posts/admin/all`;
  console.log(`📡  Fetching full article list: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching list`);
  const data = (await res.json()) as { posts?: GhnListItem[] };
  return data.posts ?? [];
}

/* ── Fetch one article's full record (includes body/content) ──── */
async function fetchFull(id: number): Promise<GhnFull | null> {
  try {
    const res = await fetch(`${GHN_BASE}/api/posts/admin/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as GhnFull;
  } catch {
    return null;
  }
}

/* ── Main ──────────────────────────────────────────────────────── */
async function main() {
  console.log("\n🚀  GH Newspapers → GNN Migration");
  console.log("   Source: https://ghananewspapers.com/api");
  console.log("   Target: GNN Neon Postgres\n");

  let list: GhnListItem[];
  try {
    list = await fetchList();
  } catch (err) {
    console.error("❌  Failed to fetch article list:", err);
    process.exit(1);
  }

  console.log(`✅  Found ${list.length} articles\n`);
  if (list.length === 0) {
    console.log("Nothing to migrate. Exiting.");
    return;
  }

  let inserted = 0, skipped = 0, failed = 0;

  for (const item of list) {
    const id   = `ghn-${item.id}`;
    const slug = makeSlug(item.slug || "", rendered(item.title), item.id);

    try {
      const exists = await prisma.article.findFirst({
        where: { OR: [{ id }, { slug }] },
        select: { id: true },
      });

      if (exists) {
        skipped++;
        process.stdout.write("·");
        continue;
      }

      // Fetch the full record for the body (list endpoint omits content)
      const full = await fetchFull(item.id);

      const title   = rendered(full?.title   ?? item.title);
      const rawBody = rendered(full?.content);
      const body    = htmlToBody(rawBody);
      const excerpt = (stripHtml(rendered(full?.excerpt ?? item.excerpt)) || body.slice(0, 200)).slice(0, 300);
      const image   = full?.imageUrl || full?.image_url || item.imageUrl || item.image_url || "";
      const author  = full?.author || item.author || "GH Newspapers";
      const tags    = parseTags(full?.tags ?? "");

      const rawDate     = item.published_at || item.created_at || full?.date || item.date || "";
      const publishedAt = rawDate ? new Date(rawDate) : new Date();
      const rawSched    = item.scheduled_at || full?.scheduled_at || "";
      const status      = ["published", "draft", "scheduled"].includes(item.status) ? item.status : "draft";

      await prisma.article.create({
        data: {
          id,
          slug,
          title:        title || "(Untitled)",
          excerpt:      excerpt || "",
          body:         body || excerpt || "",
          category:     mapCategory(item.category),
          author,
          imageUrl:     image || null,
          tags,
          status,
          scheduledFor: rawSched ? new Date(rawSched) : null,
          isBreaking:   false,
          isFeatured:   false,
          rating:       0,
          views:        item.views ?? 0,
          publishedAt,
          updatedAt:    publishedAt,
        },
      });

      inserted++;
      process.stdout.write("✓");
    } catch (err: unknown) {
      failed++;
      process.stdout.write("✗");
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n   ⚠️  [${item.id}] "${rendered(item.title).slice(0, 40)}": ${msg}`);
    }
  }

  console.log(`\n\n🎉  Migration complete!`);
  console.log(`   ✓ ${inserted} inserted`);
  console.log(`   · ${skipped} already existed (skipped)`);
  console.log(`   ✗ ${failed} failed`);
  console.log(`\n   Live at: https://gnn-news-channel.vercel.app/\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
