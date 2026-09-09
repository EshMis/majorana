import "./dom-env.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, fireEvent, render } from "@testing-library/react";
import { LandingPrompt } from "../../components/landing-prompt.tsx";
import { HOME_COPY } from "../../lib/public-copy.ts";

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
