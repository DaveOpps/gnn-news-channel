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
    "flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3.5 py-2 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-black uppercase tracking-widest text-neutral-400 mr-1">
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
        className={`${btn} ${copied ? "bg-green-600 text-white" : "bg-neutral-200 hover:bg-neutral-300 text-neutral-800"}`}
      >
        {copied ? "✓ Copied" : "Copy Link"}
      </button>
    </div>
  );
}
