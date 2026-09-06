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

test("the proxy forwards build=solution by name, and forwards nothing else", async () => {
  // The button sent `?build=solution`, the Next.js route built its upstream URL from
  // `params` alone, and the author received the redacted build with no error and a
  // filename saying solutions. A control that silently returns the wrong file is worse
  // than the missing control it replaced.
  //
  // Asserted on the route's source rather than by standing up a Next handler: what went
  // wrong is that the request object was never consulted, which is visible here and is
  // the thing that must not come back.
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../app/api/notebooks/[notebookId]/versions/[seq]/export/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /searchParams\.get\("build"\)/, "the route must read the parameter");
  assert.match(source, /export\.ipynb\$\{query\}/, "and must put it on the upstream URL");
  // An allowlist of one, asserted POSITIVELY: this proxy attaches the session's bearer
  // token, so a pass-through of the whole query string would let a caller put arbitrary
  // parameters in front of an authenticated request.
  //
  // The first version of this assertion was a blacklist — `doesNotMatch(/url\.search|
  // searchParams\.toString\(\)/)` — and a mutation replacing the literal with
  // `new URL(request.url).search` sailed straight through it, because that text contains
  // neither spelling. Enumerating the ways a thing can be wrong is unbounded; asserting
  // what it must BE is one line and closes the set.
  assert.match(
    source,
    /const query = build === "solution" \? "\?build=solution" : "";/,
    "the upstream query must be a literal chosen from the allowlisted value, never the "
      + "caller's own query string",
  );
});
