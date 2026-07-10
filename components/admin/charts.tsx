"use client";

import { useState } from "react";
import { compact } from "@/lib/format";

/**
 * Inline SVG charts. One series, one hue — #0052a3, validated against the
 * white card surface (lightness band, chroma floor, 3:1 contrast).
 *
 * Rules held to deliberately: bars capped at 24px with a 4px rounded data-end
 * and a square baseline; a 2px surface gap between neighbours; solid hairline
 * gridlines; labels only on the extreme and the newest column; and every chart
 * carries a table-view twin so no value is gated behind a tooltip.
 */

const SERIES = "#0052a3";
const TRACK = "#cde2fb"; // lightest step of the same blue ramp
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const MUTED = "#898781";

/** Clean axis ceiling: 0, 5, 10, 25, 50, 100, 250 … */
function niceMax(v: number): number {
  if (v <= 5) return 5;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * mag;
    if (candidate >= v) return candidate;
  }
  return 10 * mag;
}

export function ViewsColumnChart({
  data,
}: {
  data: { date: string; label: string; count: number }[];
}) {
  const [showTable, setShowTable] = useState(false);

  const W = 720;
  const PLOT_H = 180;
  const AXIS_H = 26; // the container includes the axis band, never clips it
  const PAD_L = 42;
  const PAD_R = 8;

  const max = niceMax(Math.max(1, ...data.map((d) => d.count)));
  const band = (W - PAD_L - PAD_R) / data.length;
  const barW = Math.min(24, band - 2); // 2px surface gap between neighbours
  const peak = data.reduce((m, d, i) => (d.count > data[m].count ? i : m), 0);
  const ticks = [0, max / 2, max];

  const y = (v: number) => PLOT_H - (v / max) * PLOT_H;

  if (showTable) {
    return (
      <TableTwin
        onBack={() => setShowTable(false)}
        head={["Day", "Views"]}
        rows={data.map((d) => [d.label, d.count.toLocaleString()])}
      />
    );
  }

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${PLOT_H + AXIS_H}`}
        className="w-full"
        role="img"
        aria-label="Daily page views over the last two weeks"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? AXIS : GRID}
              strokeWidth="1"
            />
            <text
              x={PAD_L - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill={MUTED}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {compact(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const h = d.count === 0 ? 0 : Math.max(2, (d.count / max) * PLOT_H);
          const x = PAD_L + i * band + (band - barW) / 2;
          const isLast = i === data.length - 1;
          const label = i === peak || isLast;
          return (
            <g key={d.date}>
              {h > 0 && (
                // 4px rounded data-end, square at the baseline
                <path
                  d={`M${x},${PLOT_H} L${x},${y(d.count) + 4} Q${x},${y(d.count)} ${x + 4},${y(
                    d.count
                  )} L${x + barW - 4},${y(d.count)} Q${x + barW},${y(d.count)} ${x + barW},${
                    y(d.count) + 4
                  } L${x + barW},${PLOT_H} Z`}
                  fill={SERIES}
                >
                  <title>{`${d.label}: ${d.count.toLocaleString()} views`}</title>
                </path>
              )}
              {label && d.count > 0 && (
                <text
                  x={x + barW / 2}
                  y={y(d.count) - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#0b0b0b"
                >
                  {compact(d.count)}
                </text>
              )}
              {(i % 2 === 0 || isLast) && (
                <text
                  x={x + barW / 2}
                  y={PLOT_H + 17}
                  textAnchor="middle"
                  fontSize="10"
                  fill={MUTED}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex items-center justify-between text-xs text-zinc-400">
        <span>Daily views, last {data.length} days</span>
        <button
          onClick={() => setShowTable(true)}
          className="underline underline-offset-2 transition-colors hover:text-zinc-700"
        >
          View as table
        </button>
      </figcaption>
    </figure>
  );
}

/** 12-point sparkline for a stat tile. Single hue, no axis, no labels. */
export function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const W = 96;
  const H = 26;
  const max = Math.max(1, ...points);
  const step = W / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${H - (p / max) * (H - 4) - 2}`)
    .join(" ");
  const lastX = (points.length - 1) * step;
  const lastY = H - (points[points.length - 1] / max) * (H - 4) - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden className="overflow-visible">
      <path d={d} fill="none" stroke={TRACK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* current period in the accent, per the stat-tile contract */}
      <circle cx={lastX} cy={lastY} r="3.5" fill={SERIES} stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}

/** A horizontal meter. Track is a lighter step of the fill's own ramp. */
export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-1.5 w-16 overflow-hidden rounded-full"
        style={{ backgroundColor: TRACK }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: SERIES }}
        />
      </span>
      <span className="text-xs tabular-nums text-zinc-600">{label ?? `${Math.round(pct)}%`}</span>
    </span>
  );
}

/** Bar list for rankings — one hue, value at the tip. */
export function BarList({
  items,
}: {
  items: { id: string; label: string; value: number; hint?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.id}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-zinc-800">{it.label}</span>
            <span className="shrink-0 text-xs tabular-nums text-zinc-500">
              {it.value.toLocaleString()}
              {it.hint && <span className="ml-1.5 text-zinc-400">{it.hint}</span>}
            </span>
          </div>
          <span className="block h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: TRACK }}>
            <span
              className="block h-full rounded-full"
              style={{ width: `${(it.value / max) * 100}%`, backgroundColor: SERIES }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

function TableTwin({
  head,
  rows,
  onBack,
}: {
  head: string[];
  rows: (string | number)[][];
  onBack: () => void;
}) {
  return (
    <div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              {head.map((h) => (
                <th
                  key={h}
                  className="py-2 text-[11px] font-medium uppercase tracking-[0.09em] text-zinc-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={`py-2 text-zinc-700 ${j > 0 ? "tabular-nums" : ""}`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={onBack}
        className="mt-2 text-xs text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-700"
      >
        Back to chart
      </button>
    </div>
  );
}
