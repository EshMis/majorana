import "./dom-env.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, fireEvent, render } from "@testing-library/react";
import { HowItWorks, STAGE_DWELL_MS } from "../../components/how-it-works.tsx";
import { HOME_COPY } from "../../lib/public-copy.ts";

// jsdom ships no matchMedia and no IntersectionObserver; the section treats the
// missing observer as "on screen" and the query below as the motion preference.
let reduce = false;
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: () => ({ get matches() { return reduce; }, addEventListener() {}, removeEventListener() {} }),
});

function mount(locale: "en" | "ja" = "en") {
  const copy = HOME_COPY[locale];
  return render(<HowItWorks copy={copy.how} items={copy.product.items} locale={locale} />);
}

test("both locales pair a stage with every surface, in the same order", () => {
  for (const locale of ["en", "ja"] as const) {
    const { how, product } = HOME_COPY[locale];
    assert.equal(how.stages.length, product.items.length, `${locale}: stages and surfaces differ in count`);
    assert.deepEqual(how.stages.map((stage) => stage.figure), ["nala", "studio", "atlas", "notebooks", "qapps"]);
  }
});

test("five nodes open five stages, each with the way into its surface", () => {
  reduce = true;
  const view = mount();
  const tabs = view.getAllByRole("tab");
  assert.equal(tabs.length, 5);
  assert.equal(tabs[0]!.getAttribute("aria-selected"), "true");
  const panels = () => Array.from(view.container.querySelectorAll('[role="tabpanel"]'));
  assert.deepEqual(panels().map((panel) => panel.hasAttribute("hidden")), [false, true, true, true, true]);
  fireEvent.click(tabs[2]!);
  assert.deepEqual(panels().map((panel) => panel.hasAttribute("hidden")), [true, true, false, true, true]);
  assert.equal(panels()[2]!.querySelector("a")?.getAttribute("href"), HOME_COPY.en.product.items[2]!.href);
  fireEvent.keyDown(view.getByRole("tablist"), { key: "ArrowRight" });
  assert.equal(tabs[3]!.getAttribute("aria-selected"), "true");
  fireEvent.keyDown(view.getByRole("tablist"), { key: "End" });
  assert.equal(tabs[4]!.getAttribute("aria-selected"), "true");
  fireEvent.keyDown(view.getByRole("tablist"), { key: "ArrowRight" });
  assert.equal(tabs[0]!.getAttribute("aria-selected"), "true", "the rail wraps");
});

test("the rail advances by itself, stops once the reader takes over, and never under reduced motion", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  reduce = false;
  const view = mount();
  const selected = () => view.getAllByRole("tab").findIndex((tab) => tab.getAttribute("aria-selected") === "true");
  assert.equal(view.container.querySelector("section")?.dataset.playing, "true");
  act(() => { t.mock.timers.tick(STAGE_DWELL_MS); });
  assert.equal(selected(), 1, "one dwell moves the rail one node on");
  fireEvent.click(view.getAllByRole("tab")[3]!);
  assert.equal(view.container.querySelector("section")?.dataset.playing, "false");
  act(() => { t.mock.timers.tick(STAGE_DWELL_MS * 2); });
  assert.equal(selected(), 3, "a reader's choice is not moved on");
  view.unmount();
  reduce = true;
  const still = mount();
  assert.equal(still.container.querySelector("section")?.dataset.playing, "false");
  act(() => { t.mock.timers.tick(STAGE_DWELL_MS * 2); });
  assert.equal(still.getAllByRole("tab")[0]!.getAttribute("aria-selected"), "true");
});
