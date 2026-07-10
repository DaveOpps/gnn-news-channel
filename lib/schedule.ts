import { ArticleStatus } from "./types";

export type ParsedSchedule =
  | { status: ArticleStatus; scheduledFor?: string }
  | { error: string };

/**
 * Validates the status + schedule pair coming off the article form.
 * A "scheduled" story must carry a real, future timestamp.
 */
export function parseSchedule(body: {
  status?: unknown;
  scheduledFor?: unknown;
}): ParsedSchedule {
  const raw = String(body.status ?? "published");
  if (raw === "draft") return { status: "draft" };

  if (raw === "scheduled") {
    const when = String(body.scheduledFor ?? "").trim();
    const at = new Date(when);
    if (!when || Number.isNaN(at.getTime())) {
      return { error: "Pick a date and time to schedule this story" };
    }
    if (at.getTime() <= Date.now()) {
      return { error: "Scheduled time must be in the future" };
    }
    return { status: "scheduled", scheduledFor: at.toISOString() };
  }

  return { status: "published" };
}
