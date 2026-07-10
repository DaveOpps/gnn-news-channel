import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

/* ------------------------------------------------------------------ */
/*  Icons — 24px stroke set, sized by the `className` on the caller.    */
/* ------------------------------------------------------------------ */

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const Icon = {
  Dashboard: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Articles: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5V19a1 1 0 0 0 1 1H6a2 2 0 0 1-2-2Z" />
      <path d="M16 8h2.5A1.5 1.5 0 0 1 20 9.5V18a2 2 0 0 1-2 2" />
      <path d="M7 8h6M7 11.5h6M7 15h4" />
    </svg>
  ),
  Pen: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      <path d="m14.5 5.5 3 3" />
    </svg>
  ),
  Comments: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />
    </svg>
  ),
  Mail: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  ),
  Chart: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  Users: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a3.25 3.25 0 0 1 0 6.5M17.5 14.5A6.5 6.5 0 0 1 21.5 20" />
    </svg>
  ),
  Globe: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  Logout: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
      <path d="m15 16 4-4-4-4M19 12H9" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  ),
  Eye: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  ),
  Trash: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M10 11v6M14 11v6" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  ),
  Undo: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
      <path d="m8 5-4 4 4 4" />
    </svg>
  ),
  Download: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 3v12M8 11l4 4 4-4M4 20h16" />
    </svg>
  ),
  Trend: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m3 16 5.5-5.5 3.5 3.5L21 5" />
      <path d="M15 5h6v6" />
    </svg>
  ),
  External: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M14 4h6v6M20 4l-8 8" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  ),
  Alert: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 3.5 22 20H2Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  ),
  Image: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Class tokens                                                        */
/* ------------------------------------------------------------------ */

export const card =
  "rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

export const microLabel =
  "text-[11px] font-medium uppercase tracking-[0.09em] text-zinc-500";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-50";

export const btnDark =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50";

export const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-shadow focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5";

/* ------------------------------------------------------------------ */
/*  Primitives                                                          */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${card} ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {action}
    </div>
  );
}

type BadgeTone = "success" | "warning" | "neutral" | "brand" | "info";

const TONES: Record<BadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  neutral: "bg-zinc-50 text-zinc-600 ring-zinc-500/20",
  brand: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  emphasis = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  emphasis?: boolean;
}) {
  const body = (
    <div
      className={`${card} h-full p-5 transition-all ${
        href ? "hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(16,24,40,0.06)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={microLabel}>{label}</p>
        {icon && (
          <span
            className={`shrink-0 ${emphasis ? "text-brand" : "text-zinc-300"}`}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-zinc-900 tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-zinc-400">{hint}</p>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <span className="mb-3 text-zinc-300">{icon}</span>}
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
    </div>
  );
}
