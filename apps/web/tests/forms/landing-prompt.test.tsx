import "./dom-env.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, fireEvent, render } from "@testing-library/react";
import { LandingPrompt } from "../../components/landing-prompt.tsx";
import { HOME_COPY } from "../../lib/public-copy.ts";

// jsdom ships no matchMedia; the component reads the reduced-motion query on
// mount (matches: false here, so the rotation runs).
const media = { matches: false, addEventListener() {}, removeEventListener() {} };
Object.defineProperty(window, "matchMedia", { configurable: true, value: () => media });

test("landing prompt unlocks a stalled navigation and keeps the draft available to retry", (t) => {
  let retry!: () => void;
  const originalTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, "setTimeout", ((callback: () => void, delay: number) => {
    if (delay === 8000) {
      retry = callback;
      return -1 as unknown as ReturnType<typeof setTimeout>;
    }
    return originalTimeout(callback, delay);
  }) as typeof setTimeout);
  const globals = globalThis as typeof globalThis & { __formTestRouterPush?: (href: string) => void };
  const previous = globals.__formTestRouterPush;
  const navigations: string[] = [];
  globals.__formTestRouterPush = href => { navigations.push(href); };
  try {
    const view = render(<LandingPrompt copy={HOME_COPY.en.promptDemo} />);
    const input = view.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "Build a Bell state" } });
    const form = view.container.querySelector("form")!;
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    assert.deepEqual(navigations, ["/run"]);
    assert.equal(input.disabled, true);
    act(() => retry());
    assert.equal(input.disabled, false);
    assert.equal(input.value, "Build a Bell state");
    assert.ok(view.getByRole("status"));
    fireEvent.submit(form);
    assert.deepEqual(navigations, ["/run", "/run"]);
  } finally {
    globals.__formTestRouterPush = previous;
  }
});

test("the cover box types a suggestion out, clears it when the visitor writes, and Tab accepts the whole sentence", (t) => {
  t.mock.timers.enable({ apis: ["setInterval", "Date"] });
  const view = render(<LandingPrompt copy={HOME_COPY.en.promptDemo} />);
  const input = view.getByRole("textbox") as HTMLTextAreaElement;
  const overlay = () => view.container.querySelector(".mj-composer-ghost-overlay");
  // At t=0 the first frame is empty; five characters in, five are drawn.
  assert.ok(overlay(), "the ghost layer mounts while the box is empty");
  act(() => { t.mock.timers.tick(5 * 30 + 1); });
  const first = HOME_COPY.en.promptDemo.prompts[0]!;
  assert.equal(overlay()?.textContent, first.slice(0, 5));
  assert.equal(input.placeholder, "", "the placeholder must stay empty while the ghost draws");
  // Tab accepts the WHOLE prompt, never the five characters on screen.
  fireEvent.keyDown(input, { key: "Tab" });
  assert.equal(input.value, first);
  assert.equal(overlay(), null, "a typed value hides the ghost");
  // Clearing the box restarts the rotation from its first character.
  fireEvent.change(input, { target: { value: "" } });
  assert.ok(overlay());
  assert.equal(overlay()?.textContent, "");
});
