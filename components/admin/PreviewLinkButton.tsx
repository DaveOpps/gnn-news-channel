"use client";

import { useState } from "react";
import { Icon } from "./ui";

/**
 * Copies a shareable preview URL for an unpublished story. The token is signed
 * server-side, so the recipient needs no newsroom login.
 */
export default function PreviewLinkButton({
  slug,
  token,
}: {
  slug: string;
  token: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/article/${slug}?preview=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this preview link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy a shareable preview link"
      className={`rounded-md p-1.5 transition-colors ${
        copied
          ? "bg-emerald-50 text-emerald-600"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      }`}
    >
      {copied ? <Icon.Check className="h-4 w-4" /> : <Icon.Eye className="h-4 w-4" />}
    </button>
  );
}
