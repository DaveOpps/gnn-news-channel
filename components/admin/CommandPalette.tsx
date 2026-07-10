"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./ui";

type Item = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  run: () => void;
};

type SearchResults = {
  articles: { id: string; title: string; status: string }[];
  comments: { id: string; name: string; text: string; articleId: string }[];
  editors: { id: string; name: string; username: string }[];
};

const EMPTY: SearchResults = { articles: [], comments: [], editors: [] };

export default function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K anywhere in the admin
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(EMPTY);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search — a keystroke shouldn't cost a request.
  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch {
        /* transient */
      }
    }, 160);
    return () => clearTimeout(id);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const ic = "h-4 w-4";

  const navigation: Item[] = [
    { id: "n-dash", label: "Dashboard", group: "Go to", icon: <Icon.Dashboard className={ic} />, run: () => go("/admin") },
    { id: "n-articles", label: "Articles", group: "Go to", icon: <Icon.Articles className={ic} />, run: () => go("/admin/articles") },
    { id: "n-new", label: "New article", hint: "Create", group: "Actions", icon: <Icon.Plus className={ic} />, run: () => go("/admin/articles/new") },
    { id: "n-comments", label: "Comments", group: "Go to", icon: <Icon.Comments className={ic} />, run: () => go("/admin/comments") },
    { id: "n-media", label: "Media library", group: "Go to", icon: <Icon.Image className={ic} />, run: () => go("/admin/media") },
    { id: "n-insights", label: "Audience insights", group: "Go to", icon: <Icon.Trend className={ic} />, run: () => go("/admin/insights") },
    { id: "n-perf", label: "Editor performance", group: "Go to", icon: <Icon.Chart className={ic} />, run: () => go("/admin/analytics") },
    { id: "n-activity", label: "Activity log", group: "Go to", icon: <Icon.Clock className={ic} />, run: () => go("/admin/activity") },
    { id: "n-subs", label: "Subscribers", group: "Go to", icon: <Icon.Mail className={ic} />, run: () => go("/admin/subscribers") },
    { id: "n-trash", label: "Trash", group: "Go to", icon: <Icon.Trash className={ic} />, run: () => go("/admin/trash") },
    { id: "n-account", label: "My account", group: "Go to", icon: <Icon.Users className={ic} />, run: () => go("/admin/account") },
    { id: "n-site", label: "View live site", group: "Actions", icon: <Icon.Globe className={ic} />, run: () => { setOpen(false); window.open("/", "_blank"); } },
  ];

  if (isAdmin) {
    navigation.splice(2, 0, {
      id: "n-home",
      label: "Homepage curation",
      group: "Go to",
      icon: <Icon.Dashboard className={ic} />,
      run: () => go("/admin/homepage"),
    });
    navigation.push({
      id: "n-editors",
      label: "Editors",
      group: "Go to",
      icon: <Icon.Users className={ic} />,
      run: () => go("/admin/editors"),
    });
  }

  const q = query.trim().toLowerCase();

  const items: Item[] = q
    ? [
        ...results.articles.map((a) => ({
          id: `a-${a.id}`,
          label: a.title,
          hint: a.status,
          group: "Stories",
          icon: <Icon.Articles className={ic} />,
          run: () => go(`/admin/articles/${a.id}`),
        })),
        ...results.comments.map((c) => ({
          id: `c-${c.id}`,
          label: `${c.name}: ${c.text}`,
          group: "Comments",
          icon: <Icon.Comments className={ic} />,
          run: () => go("/admin/comments"),
        })),
        ...results.editors.map((e) => ({
          id: `e-${e.id}`,
          label: e.name,
          hint: `@${e.username}`,
          group: "Editors",
          icon: <Icon.Users className={ic} />,
          run: () => go("/admin/editors"),
        })),
        ...navigation.filter((n) => n.label.toLowerCase().includes(q)),
      ]
    : navigation;

  useEffect(() => setActive(0), [query, results]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    }
  }

  if (!open) return null;

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/50 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4">
          <Icon.Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search stories, comments, editors — or jump to a screen…"
            className="w-full border-0 py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
          />
          <kbd className="shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            ESC
          </kbd>
        </div>

        <ul className="max-h-[22rem] overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-zinc-400">
              Nothing found for “{query}”
            </li>
          )}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id}>
                {header && (
                  <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.09em] text-zinc-400">
                    {header}
                  </p>
                )}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={item.run}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    i === active ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <span className="shrink-0 text-zinc-400">{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="shrink-0 text-xs text-zinc-400">{item.hint}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-zinc-100 bg-zinc-50/70 px-4 py-2 text-[11px] text-zinc-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
