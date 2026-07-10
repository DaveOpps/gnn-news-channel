/**
 * Who is reading right now.
 *
 * Deliberately in-memory: "right now" has no meaning across a restart, and a
 * heartbeat every 20s would thrash a file store. A reader is counted while
 * their last heartbeat is younger than TTL.
 */

type Beat = { articleId?: string; at: number };

const TTL_MS = 60_000;

// Survive dev-server hot reloads, which re-evaluate this module.
const globalForPresence = globalThis as unknown as { __gnnBeats?: Map<string, Beat> };
const beats: Map<string, Beat> = (globalForPresence.__gnnBeats ??= new Map());

function prune(now = Date.now()) {
  const cutoff = now - TTL_MS;
  for (const [id, beat] of beats) {
    if (beat.at < cutoff) beats.delete(id);
  }
}

export function heartbeat(sessionId: string, articleId?: string) {
  if (!sessionId) return;
  beats.set(sessionId, { articleId, at: Date.now() });
  prune();
}

/** Readers on one story, or across the whole site when no id is given. */
export function activeReaders(articleId?: string): number {
  prune();
  if (!articleId) return beats.size;
  let n = 0;
  for (const beat of beats.values()) if (beat.articleId === articleId) n++;
  return n;
}

/** Readers per story, busiest first. */
export function readersByArticle(): Record<string, number> {
  prune();
  const out: Record<string, number> = {};
  for (const beat of beats.values()) {
    if (beat.articleId) out[beat.articleId] = (out[beat.articleId] ?? 0) + 1;
  }
  return out;
}
