import assert from "node:assert/strict";
import { test } from "node:test";
import type { components } from "@majorana/contracts-gen";
import { canDownloadSolutions } from "./notebook-download.ts";

type Notebook = components["schemas"]["Notebook"];

const AUTHOR = "11111111-1111-4111-8111-111111111111";
const SOMEONE_ELSE = "22222222-2222-4222-8222-222222222222";

function notebook(overrides: Partial<Notebook> = {}): Notebook {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    workspace_id: "44444444-4444-4444-8444-444444444444",
    owner_user_id: AUTHOR,
    slug: "a-quiz-ab12cd34",
    title: "A quiz",
    kind: "quiz",
    summary: "",
    visibility: "private",
    language: "en",
    framework: { name: "qiskit", version: ">=2.5,<2.6", execution: "local-statevector" },
    current_version_id: null,
    current_version_seq: 1,
    latest_status: "ready",
    latest_run_id: null,
    version_count: 1,
    created_at: "2026-09-06T00:00:00Z",
    updated_at: "2026-09-06T00:00:00Z",
    ...overrides,
  } as Notebook;
}

test("the author of a quiz is offered their own answer key", () => {
  assert.equal(canDownloadSolutions(notebook(), AUTHOR), true);
});

test("a colleague is not — the server refuses it too, and offering a button that 403s is worse than hiding it", () => {
  assert.equal(canDownloadSolutions(notebook(), SOMEONE_ELSE), false);
});

test("nor is the author of a LESSON, whose two downloads would be byte-identical", () => {
  // Not an authorization question: a lesson's reader build IS the full build. A second
  // button here offers a choice with no difference, which teaches a reader that the
  // label means nothing — and the next time they see it, on a quiz, they ignore it.
  assert.equal(canDownloadSolutions(notebook({ kind: "lesson" }), AUTHOR), false);
  assert.equal(canDownloadSolutions(notebook({ kind: "lab" }), AUTHOR), false);
  assert.equal(canDownloadSolutions(notebook({ kind: "challenge" }), AUTHOR), true);
});

test("and nobody is, before /api/me has answered", () => {
  // Appearing a moment late beats appearing wrongly and then vanishing.
  assert.equal(canDownloadSolutions(notebook(), null), false);
  assert.equal(canDownloadSolutions(null, AUTHOR), false);
});
