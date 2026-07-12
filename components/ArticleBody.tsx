import type { ReactNode } from "react";
import { youtubeId } from "@/lib/types";

/**
 * Renders the story body from a small, deliberate markup subset.
 *
 * Everything is turned into React elements — never raw HTML — so an editor
 * cannot inject a script, and a malformed line degrades to plain text rather
 * than breaking the page.
 *
 *   ## Heading            ### Subheading
 *   > Pull quote
 *   - List item
 *   ![alt](url)           inline image
 *   @youtube(url or id)   video embed
 *   @embed(url)           link card
 *   **bold**  *italic*  `code`  [text](url)
 */

/** Only allow schemes that cannot execute script. */
function safeHref(raw: string): string | null {
  const url = raw.trim();
  if (url.startsWith("/") || url.startsWith("#")) return url;
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  return null;
}

const INLINE = /(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(`[^`\n]+`)|(\[[^\]\n]+\]\([^)\s]+\))/g;

function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;

  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-i${i++}`;

    if (tok.startsWith("**")) {
      out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={k} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[0.9em]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("[")) {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      const href = mm ? safeHref(mm[2]) : null;
      if (mm && href) {
        const external = /^https?:\/\//i.test(href);
        out.push(
          <a
            key={k}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-brand underline underline-offset-2 hover:text-brand-dark"
          >
            {mm[1]}
          </a>
        );
      } else {
        out.push(tok); // unsafe or malformed → show the raw text
      }
    } else {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Block({ raw, index }: { raw: string; index: number }) {
  const block = raw.trim();
  const key = `b${index}`;

  // ![alt](url)
  const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(block);
  if (img) {
    const src = safeHref(img[2]);
    if (src) {
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={img[1]} className="w-full rounded object-cover" />
          {img[1] && (
            <figcaption className="mt-2 text-center text-sm text-neutral-500">
              {img[1]}
            </figcaption>
          )}
        </figure>
      );
    }
  }

  // @youtube(...)
  const yt = /^@youtube\(([^)]+)\)$/i.exec(block);
  if (yt) {
    const id = youtubeId(yt[1]);
    if (id) {
      return (
        <div className="my-8 aspect-video overflow-hidden rounded bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Embedded video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="h-full w-full"
          />
        </div>
      );
    }
  }

  // @embed(url) → a link card, no third-party script
  const emb = /^@embed\(([^)\s]+)\)$/i.exec(block);
  if (emb) {
    const href = safeHref(emb[1]);
    if (href) {
      let host = href;
      try {
        host = new URL(href).hostname.replace(/^www\./, "");
      } catch {
        /* keep the raw href */
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="my-8 flex items-center gap-3 rounded border border-neutral-200 bg-white p-4 no-underline transition-colors hover:border-brand"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm">
            ↗
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-neutral-900">
              {host}
            </span>
            <span className="block truncate text-xs text-neutral-500">{href}</span>
          </span>
        </a>
      );
    }
  }

  // ## / ###
  const h = /^(#{2,3})\s+(.*)$/.exec(block);
  if (h) {
    const text = renderInline(h[2], key);
    return h[1].length === 2 ? (
      <h2 className="mt-10 mb-3 text-2xl font-black leading-tight text-neutral-900">
        {text}
      </h2>
    ) : (
      <h3 className="mt-8 mb-2 text-xl font-bold leading-tight text-neutral-900">
        {text}
      </h3>
    );
  }

  // > pull quote (may span lines)
  if (block.startsWith(">")) {
    const text = block
      .split("\n")
      .map((l) => l.replace(/^>\s?/, ""))
      .join(" ")
      .trim();
    return (
      <blockquote className="my-8 border-l-4 border-brand pl-5 text-xl font-medium italic leading-relaxed text-neutral-800">
        {renderInline(text, key)}
      </blockquote>
    );
  }

  // - bullet list
  if (/^-\s+/.test(block)) {
    const items = block
      .split("\n")
      .filter((l) => /^-\s+/.test(l.trim()))
      .map((l) => l.trim().replace(/^-\s+/, ""));
    return (
      <ul className="my-6 list-disc space-y-2 pl-6">
        {items.map((it, i) => (
          <li key={`${key}-l${i}`} className="leading-relaxed">
            {renderInline(it, `${key}-l${i}`)}
          </li>
        ))}
      </ul>
    );
  }

  return <p>{renderInline(block, key)}</p>;
}

export default function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  return (
    <>
      {blocks.map((b, i) => (
        <Block key={i} raw={b} index={i} />
      ))}
    </>
  );
}
