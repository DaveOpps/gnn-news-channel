"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./ui";

type Item = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

export default function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: Item[] = [
    { href: "/admin", label: "Dashboard", icon: <Icon.Dashboard className="h-[18px] w-[18px]" />, exact: true },
    { href: "/admin/articles", label: "Articles", icon: <Icon.Articles className="h-[18px] w-[18px]" /> },
    { href: "/admin/articles/new", label: "New Article", icon: <Icon.Pen className="h-[18px] w-[18px]" />, exact: true },
    { href: "/admin/comments", label: "Comments", icon: <Icon.Comments className="h-[18px] w-[18px]" /> },
    { href: "/admin/subscribers", label: "Subscribers", icon: <Icon.Mail className="h-[18px] w-[18px]" /> },
    { href: "/admin/analytics", label: "Performance", icon: <Icon.Chart className="h-[18px] w-[18px]" /> },
  ];

  if (isAdmin) {
    items.push({
      href: "/admin/editors",
      label: "Editors",
      icon: <Icon.Users className="h-[18px] w-[18px]" />,
    });
  }

  function matches(item: Item) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  // Exactly one item is ever active: the most specific (longest) href that
  // matches. Without this, /admin/articles/new lights up both "Articles"
  // (prefix match) and "New Article".
  const activeHref = items
    .filter(matches)
    .reduce<string | null>(
      (best, item) => (best && best.length >= item.href.length ? best : item.href),
      null
    );

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-zinc-800/80 font-medium text-white"
                : "font-normal text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand" />
            )}
            <span className={active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
