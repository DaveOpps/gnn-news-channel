export type DiffLine = { type: "same" | "add" | "remove"; text: string };

/**
 * Line-level diff via longest common subsequence. Story bodies are a few
 * hundred lines at most, so the O(n·m) table is not worth optimising away —
 * and an exact LCS reads far better than a heuristic when an editor is
 * deciding whether to roll a change back.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");

  // lcs[i][j] = length of the LCS of a[i..] and b[j..]
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ type: "remove", text: a[i] });
      i++;
    } else {
      out.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < a.length) out.push({ type: "remove", text: a[i++] });
  while (j < b.length) out.push({ type: "add", text: b[j++] });

  return out;
}

/** Collapse long runs of unchanged lines so the eye lands on the changes. */
export function collapseContext(lines: DiffLine[], context = 2): (DiffLine | { type: "gap"; count: number })[] {
  const changed = new Set<number>();
  lines.forEach((l, i) => {
    if (l.type !== "same") {
      for (let k = i - context; k <= i + context; k++) changed.add(k);
    }
  });

  const out: (DiffLine | { type: "gap"; count: number })[] = [];
  let run = 0;
  lines.forEach((l, i) => {
    if (changed.has(i)) {
      if (run > 0) {
        out.push({ type: "gap", count: run });
        run = 0;
      }
      out.push(l);
    } else {
      run++;
    }
  });
  if (run > 0) out.push({ type: "gap", count: run });
  return out;
}

/** Summary counts for a revision list. */
export function diffStats(before: string, after: string): { added: number; removed: number } {
  const lines = diffLines(before, after);
  return {
    added: lines.filter((l) => l.type === "add").length,
    removed: lines.filter((l) => l.type === "remove").length,
  };
}
