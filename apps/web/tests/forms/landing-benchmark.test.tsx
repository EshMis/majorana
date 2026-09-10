import "./dom-env.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { render } from "@testing-library/react";
import { LandingBenchmark } from "../../components/landing-benchmark.tsx";
import { HOME_COPY } from "../../lib/public-copy.ts";

// The section's Reveal wrapper reads the reduced-motion query on mount; jsdom has none.
const media = { matches: true, addEventListener() {}, removeEventListener() {} };
Object.defineProperty(window, "matchMedia", { configurable: true, value: () => media });

// The figures were checked against their sources once (PR 806) and carried
// byte-identical since; the two locales must agree on every one of them.
test("the benchmark numbers are the same in both languages", () => {
  const numbers = (locale: "en" | "ja") =>
    HOME_COPY[locale].benchmark.rows.map((row) => row.scores.map((score) => [score.model, score.score]));
  assert.deepEqual(numbers("ja"), numbers("en"));
  for (const row of HOME_COPY.en.benchmark.rows) {
    assert.equal(row.scores.filter((score) => score.featured).length, 1, `${row.name}: exactly one LeonaQ score`);
    for (const score of row.scores) assert.ok(score.score >= 0 && score.score <= 100, `${score.model} is a percentage`);
  }
});

test("every score reaches the reader twice as text — the row line and the table — and once as a marker", () => {
  const view = render(<LandingBenchmark copy={HOME_COPY.en.benchmark} />);
  const rows = view.container.querySelectorAll(".lq-bench-row");
  assert.equal(rows.length, HOME_COPY.en.benchmark.rows.length);
  for (const row of HOME_COPY.en.benchmark.rows) {
    for (const score of row.scores) {
      const text = `${score.model} ${score.score.toFixed(1)}%`;
      const inLines = Array.from(view.container.querySelectorAll(".lq-bench-reported")).filter((line) => line.textContent?.includes(text)).length;
      assert.equal(inLines, 1, `${row.name}: "${text}" appears once under its row`);
    }
  }
  const cells = Array.from(view.container.querySelectorAll("tbody td:nth-child(3)")).map((cell) => cell.textContent);
  assert.equal(cells.length, HOME_COPY.en.benchmark.rows.reduce((sum, row) => sum + row.scores.length, 0));
  assert.equal(view.container.querySelectorAll(".lq-bench-track .lq-bench-dot").length, cells.length);
  assert.equal(view.container.querySelectorAll(".lq-bench-dot--leona b").length, HOME_COPY.en.benchmark.rows.length);
  assert.equal(view.container.querySelectorAll("figcaption a").length, HOME_COPY.en.benchmark.sources.length);
});
