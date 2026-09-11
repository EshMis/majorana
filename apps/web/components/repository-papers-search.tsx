"use client";

import { useRef, useState, type ReactNode } from "react";

/**
 * The only client-rendered piece of the papers index: a text box that hides
 * rows the server has already rendered.
 *
 * `children` and `yearStrip` are server-rendered markup, not data passed as
 * props — this component never receives a paper's title or authors, only the
 * finished HTML for them, so filtering never puts the corpus into the client
 * bundle a second time (the same leak `lib/repository-source.ts` warns
 * against for the barrel import).
 *
 * Filtering toggles `hidden` on each row carrying a `data-paper-search`
 * attribute, never `display`, and then hides a year group entirely once none
 * of its own rows remain visible — a search for "grover" should not leave a
 * "1963" heading standing over nothing. Each group's own paper count
 * (`data-paper-year-count`, server-rendered as "24 papers"/"24 件" against the
 * *unfiltered* group) is hidden for the same reason while a query is active:
 * this component never receives the corpus or the copy's plural rules, so it
 * cannot recompute a correct "1 of 24" without duplicating that logic — and a
 * stale total next to one visible row is worse than no number at all.
 */
export function PapersSearch({
  searchLabel,
  searchPlaceholder,
  yearStrip,
  children,
}: {
  searchLabel: string;
  searchPlaceholder: string;
  yearStrip: ReactNode;
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  function applyFilter(value: string) {
    setQuery(value);
    const root = rootRef.current;
    if (!root) return;
    const needle = value.trim().toLowerCase();
    const filtering = needle !== "";
    for (const group of root.querySelectorAll<HTMLElement>("[data-paper-year-group]")) {
      let visible = 0;
      for (const row of group.querySelectorAll<HTMLElement>("[data-paper-search]")) {
        const matches = !filtering || (row.dataset.paperSearch ?? "").includes(needle);
        row.hidden = !matches;
        if (matches) visible += 1;
      }
      group.hidden = visible === 0;
      const count = group.querySelector<HTMLElement>("[data-paper-year-count]");
      if (count) count.hidden = filtering;
    }
  }

  return (
    <div>
      <div className="mj-papers-toolbar">
        <input
          type="search"
          className="mj-papers-search-input"
          value={query}
          onChange={(event) => applyFilter(event.target.value)}
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
        />
        {yearStrip}
      </div>
      <div ref={rootRef}>{children}</div>
    </div>
  );
}
