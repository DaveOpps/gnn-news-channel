"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, VIDEO_SHOWS, youtubeId } from "@/lib/types";
import { Card, Icon, btnPrimary, btnSecondary, input, microLabel } from "./ui";

export default function VideoForm({ video }: { video?: Video }) {
  const router = useRouter();
  const isEdit = Boolean(video);

  const [title, setTitle] = useState(video?.title ?? "");
  const [show, setShow] = useState(video?.show ?? VIDEO_SHOWS[0]);
  const [youtubeUrl, setYoutubeUrl] = useState(video?.youtubeId ?? "");
  const [duration, setDuration] = useState(video?.duration ?? "");
  const [featured, setFeatured] = useState(video?.featured ?? false);
  const [detectingDuration, setDetectingDuration] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const parsedId = youtubeId(youtubeUrl);

  // Skip the very first render so opening an existing video for editing
  // doesn't immediately overwrite an already-correct duration.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!parsedId) return;

    let cancelled = false;
    setDetectingDuration(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/videos/duration?id=${parsedId}`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.duration) setDuration(data.duration);
      } finally {
        if (!cancelled) setDetectingDuration(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parsedId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!youtubeUrl.trim()) {
      setError("Paste a YouTube link or video id");
      return;
    }
    if (!parsedId) {
      setError("That doesn't look like a valid YouTube URL or video id");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        show,
        youtubeId: youtubeUrl,
        duration,
        featured,
      };
      const res = await fetch(isEdit ? `/api/videos/${video!.id}` : "/api/videos", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save video");
        return;
      }
      router.push("/admin/videos");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const sectionTitle = "text-sm font-semibold text-zinc-900";
  const label = `mb-1.5 block ${microLabel}`;
  const hint = "text-xs font-normal normal-case tracking-normal text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {isEdit ? "Edit video" : "New video"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isEdit
              ? "Update this video's details."
              : "Paste a YouTube link to add a video to Ghana Newspapers TV."}
          </p>
        </div>
        <Link
          href="/admin/videos"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back to videos
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card className="space-y-5 p-6">
        <h2 className={sectionTitle}>Details</h2>

        <div>
          <label className={label}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Ghana Newspapers at 7 — Full Bulletin"
            className={`${input} text-base font-medium`}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={label}>
              Show <span className={hint}>— pick one or type a new name</span>
            </label>
            <input
              value={show}
              onChange={(e) => setShow(e.target.value)}
              list="video-shows"
              required
              placeholder="e.g. Ghana Newspapers"
              className={input}
            />
            <datalist id="video-shows">
              {VIDEO_SHOWS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={label}>
              Duration{" "}
              <span className={hint}>
                {detectingDuration ? "— detecting from YouTube…" : "— filled in automatically, or edit it"}
              </span>
            </label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="12:04"
              className={input}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className={sectionTitle}>YouTube video</h2>

        <div>
          <label className={label}>
            YouTube URL or video id{" "}
            <span className={hint}>— watch, shorts or share links all work</span>
          </label>
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
            placeholder="https://www.youtube.com/watch?v=…"
            className={input}
          />
        </div>

        {youtubeUrl.trim() && (
          <div>
            {parsedId ? (
              <div className="relative aspect-video w-64 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${parsedId}/hqdefault.jpg`}
                  alt="Video thumbnail preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <p className="text-xs text-red-600">
                That doesn&apos;t look like a valid YouTube URL or video id.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className={sectionTitle}>Placement</h2>
        <label className="flex cursor-pointer select-none items-start gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50/70">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-[var(--brand)]"
          />
          <span>
            <span className="block text-sm font-medium text-zinc-900">Featured</span>
            <span className="block text-xs text-zinc-500">
              Shown as the hero video at the top of the Ghana Newspapers TV hub.
            </span>
          </span>
        </label>
      </Card>

      <div className="flex items-center gap-3 pb-4">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add video"}
        </button>
        <Link href="/admin/videos" className={btnSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
