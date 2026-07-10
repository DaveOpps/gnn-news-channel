"use client";

import { useRef, useState } from "react";
import ArticleBody from "@/components/ArticleBody";
import MediaPicker from "./MediaPicker";
import { input } from "./ui";

type Tool = {
  label: string;
  title: string;
  before: string;
  after?: string;
  placeholder: string;
  block?: boolean; // start on its own line
};

const TOOLS: Tool[] = [
  { label: "B", title: "Bold", before: "**", after: "**", placeholder: "bold text" },
  { label: "I", title: "Italic", before: "*", after: "*", placeholder: "italic text" },
  { label: "H2", title: "Heading", before: "## ", placeholder: "Heading", block: true },
  { label: "H3", title: "Subheading", before: "### ", placeholder: "Subheading", block: true },
  { label: "❝", title: "Pull quote", before: "> ", placeholder: "A striking quote", block: true },
  { label: "•", title: "Bullet list", before: "- ", placeholder: "List item", block: true },
  { label: "🔗", title: "Link", before: "[", after: "](https://)", placeholder: "link text" },
  { label: "▶", title: "YouTube embed", before: "@youtube(", after: ")", placeholder: "https://youtu.be/…", block: true },
];

export default function RichBodyEditor({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function apply(tool: Tool) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || tool.placeholder;

    // Block tools want to begin on a fresh line.
    let prefix = "";
    if (tool.block && start > 0 && value[start - 1] !== "\n") prefix = "\n\n";

    const insert = `${prefix}${tool.before}${selected}${tool.after ?? ""}`;
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);

    // Put the caret around the inserted text so typing replaces the placeholder.
    const selStart = start + prefix.length + tool.before.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selStart, selStart + selected.length);
    });
  }

  function insertImage(url: string, alt?: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const prefix = start > 0 && value[start - 1] !== "\n" ? "\n\n" : "";
    const snippet = `${prefix}![${alt ?? ""}](${url})\n\n`;
    onChange(value.slice(0, start) + snippet + value.slice(start));
  }

  const btn =
    "h-8 min-w-8 rounded px-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-zinc-200 bg-zinc-50 px-2 py-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            onClick={() => apply(t)}
            className={`${btn} ${t.label === "B" ? "font-black" : ""} ${
              t.label === "I" ? "italic" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          title="Insert image from the media library"
          onClick={() => setPickerOpen(true)}
          className={btn}
        >
          🖼
        </button>

        <span className="mx-1 h-5 w-px bg-zinc-200" />

        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className={`h-8 rounded px-2.5 text-xs font-semibold transition-colors ${
            preview
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-white hover:text-zinc-900"
          }`}
        >
          {preview ? "Editing" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="article-body min-h-[22rem] rounded-b-lg border border-zinc-200 bg-white p-5 text-neutral-800">
          {value.trim() ? (
            <ArticleBody body={value} />
          ) : (
            <p className="text-sm text-zinc-400">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          rows={16}
          placeholder="Write the full story here…"
          className={`${input} rounded-t-none font-mono text-[13px] leading-relaxed`}
        />
      )}

      <p className="mt-1.5 text-xs text-zinc-400">
        Blank line between paragraphs. <code>**bold**</code> · <code>*italic*</code> ·{" "}
        <code>## Heading</code> · <code>&gt; quote</code> · <code>- list</code> ·{" "}
        <code>[text](url)</code> · <code>@youtube(url)</code>
      </p>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={({ url, alt }) => insertImage(url, alt)}
      />
    </div>
  );
}
