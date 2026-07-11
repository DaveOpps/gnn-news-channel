"use client";

import { useState } from "react";

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function pageUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function open(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  const btn =
    "flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-gray mr-1">
        Share
      </span>
      <button
        onClick={() =>
          open(
            `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${pageUrl()}`)}`
          )
        }
        className={`${btn} bg-[#25D366] hover:bg-[#1ebe5b] text-white`}
      >
        WhatsApp
      </button>
      <button
        onClick={() =>
          open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(pageUrl())}`
          )
        }
        className={`${btn} bg-black hover:bg-neutral-800 text-white`}
      >
        X
      </button>
      <button
        onClick={() =>
          open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`)
        }
        className={`${btn} bg-[#1877F2] hover:bg-[#166be0] text-white`}
      >
        Facebook
      </button>
      <button
        onClick={copyLink}
        className={`${btn} ${copied ? "bg-emerald-600 text-white" : "bg-neutral-100 hover:bg-neutral-200 text-ink"}`}
      >
        {copied ? "✓ Copied" : "Copy Link"}
      </button>
    </div>
  );
}
