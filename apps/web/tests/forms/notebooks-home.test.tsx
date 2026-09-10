import "./dom-env.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { briefPreview, NotebooksHome } from "../../app/(app)/notebooks/notebooks-home.tsx";
import type { components } from "@majorana/contracts-gen";
import { WORKSPACE_COPY } from "../../lib/workspace-locale.ts";
import { stubFetch } from "./dom-env.ts";

type NotebookStarter = components["schemas"]["NotebookStarter"];

const copy = WORKSPACE_COPY.en.notebooks;

// Mirrors packages/py/notebooks/src/leona_notebooks/templates.py's
// STARTER_BRIEFS (7, level defaults to "engineer") + RESEARCH_BRIEFS (5,
// level "researcher") verbatim, so a test failure here means the fixture and
// the product copy have actually drifted apart.
const FIXTURE_STARTERS: NotebookStarter[] = [
  {
    id: "first-circuit",
    kind: "lesson",
    level: "engineer",
    title: "My first quantum circuit",
    brief: "I know Python but nothing about quantum computing. Teach me to build a one-qubit circuit in Qiskit, run it, and understand why the results are random. Use a coin-flip analogy.",
  },
  {
    id: "bell-state",
    kind: "lesson",
    level: "engineer",
    title: "Entanglement, hands on",
    brief: "Show me what entanglement means by building a Bell state, measuring both qubits many times, and comparing with two independent coins. Keep the maths minimal; explain the bitstring order Qiskit uses.",
  },
  {
    id: "grover-2q",
    kind: "demo",
    level: "engineer",
    title: "Two-qubit Grover search",
    brief: "Demonstrate Grover's algorithm on two qubits: build the oracle for one marked state, apply the diffusion operator, and show the marked state's probability after one iteration.",
  },
  {
    id: "transpile-to-target",
    kind: "lab",
    level: "engineer",
    title: "From an ideal circuit to a target-compatible one",
    brief: "A lab on transpilation in Qiskit 2.x: a Target, basis gates, routing, and what an ISA circuit is. Use GenericBackendV2 so nothing needs an account.",
  },
  {
    id: "vqe-one-qubit",
    kind: "lab",
    level: "engineer",
    title: "A one-qubit variational solver",
    brief: "Build a parameterised one-qubit circuit, define an objective with EstimatorV2, and minimise it with scipy. Show the energy landscape as a plot.",
  },
  {
    id: "hardware-first-job",
    kind: "hardware",
    level: "engineer",
    title: "Your first job on IBM Quantum hardware",
    brief: "Take a Bell circuit from local simulation to a real IBM QPU with qiskit-ibm-runtime: account setup from an environment variable, ISA transpilation, SamplerV2 submission, job monitoring and retrieval. Never put a token in the notebook.",
  },
  {
    id: "certification-drill",
    kind: "quiz",
    level: "engineer",
    title: "Certification practice: primitives and results",
    brief: "Ten original practice questions in the style of the IBM Qiskit developer certification on SamplerV2 and EstimatorV2 inputs and result objects, each with a code cell that checks the answer.",
  },
  {
    id: "reproduce-a-paper-circuit",
    kind: "walkthrough",
    level: "researcher",
    title: "Reproduce a circuit from a paper",
    brief: "I have a paper with an ansatz I want to reproduce. Build its circuit in Qiskit exactly as specified, state where in the paper each construction choice comes from, run it on a statevector simulator with a fixed seed, and compare what you get against the figure the paper reports. Say plainly which parts of the paper the reproduction does not cover.",
  },
  {
    id: "error-mitigation-study",
    kind: "benchmark",
    level: "researcher",
    title: "Does zero-noise extrapolation earn its shots?",
    brief: "Compare a raw expectation value against a zero-noise-extrapolated one on the same observable and the same noisy backend, at matched total shot budget. Report bias and variance separately, seed everything, and state what the comparison does not establish — in particular that a fake backend's noise model has no coherent error, so it flatters any twirling-based method.",
  },
  {
    id: "resource-estimate",
    kind: "benchmark",
    level: "researcher",
    title: "What would this actually cost on hardware?",
    brief: "Take an algorithm I give you, transpile it to a real device's ISA at several optimisation levels, and report two-qubit gate count, depth and estimated duration for each. Plot how the count scales with problem size. Be explicit that a transpiled count is a lower bound on what a run costs.",
  },
  {
    id: "ansatz-expressibility",
    kind: "lab",
    level: "researcher",
    title: "Expressibility and entangling capability of an ansatz",
    brief: "Measure expressibility (KL divergence of the fidelity distribution against Haar) and Meyer-Wallach entangling capability for two parameterised circuits at matched parameter count. Seed the sampling, show the fidelity histograms, and state the sample-size error on both numbers before comparing them.",
  },
  {
    id: "barren-plateau-probe",
    kind: "lab",
    level: "researcher",
    title: "Watch a barren plateau appear",
    brief: "Show the variance of a cost-function gradient collapsing as a hardware-efficient ansatz gets wider, for a fixed observable. Fit the decay, compare it against the exponential the literature predicts, and say what the fit does not establish about trainability at the sizes we can actually simulate.",
  },
];

function stubNotebooksAndTemplates(starters: NotebookStarter[]) {
  return stubFetch((request) => {
    if (request.url === "/api/notebook-templates") {
      return { status: 200, body: { starters, kinds: [] } };
    }
    if (request.url === "/api/notebooks") {
      return { status: 200, body: { items: [] } };
    }
    throw new Error(`unexpected fetch in this test: ${request.url}`);
  });
}

test("briefPreview takes the first sentence, capped at 110 characters, never mid-word", () => {
  assert.equal(
    briefPreview("Show me what entanglement means by building a Bell state. More text after the period."),
    "Show me what entanglement means by building a Bell state.",
  );
  for (const starter of FIXTURE_STARTERS) {
    const preview = briefPreview(starter.brief);
    assert.ok(preview.length <= 110, `${starter.id}: preview is ${preview.length} chars`);
    assert.ok(!preview.includes("  "), `${starter.id}: preview should not carry a double space from truncation`);
  }
  // "error-mitigation-study" has no period before ~150 characters, so this is
  // the case that actually exercises the word-boundary truncation branch.
  const longBrief = FIXTURE_STARTERS.find((starter) => starter.id === "error-mitigation-study")!.brief;
  const preview = briefPreview(longBrief);
  assert.ok(preview.length <= 110, `truncated preview is ${preview.length} chars`);
  assert.ok(preview.endsWith("…"), "a truncated preview ends with an ellipsis, not a clipped word");
  const lastWord = preview.slice(0, -1).split(" ").pop() ?? "";
  assert.ok(longBrief.includes(lastWord), "the last word before the ellipsis is a whole word from the brief");
});

test("Notebooks home shows six curated starter cards by default, then all twelve after Show all briefs", async () => {
  const fetchStub = stubNotebooksAndTemplates(FIXTURE_STARTERS);
  try {
    const view = render(<NotebooksHome locale="en" />);
    const cards = () => view.container.querySelectorAll(".mj-notebooks-starter-chip");

    await waitFor(() => assert.ok(view.getByText(copy.startersLabel)));
    await waitFor(() => assert.equal(cards().length, 6));

    const defaultIds = [
      "first-circuit",
      "bell-state",
      "grover-2q",
      "vqe-one-qubit",
      "hardware-first-job",
      "reproduce-a-paper-circuit",
    ];
    const cardsInOrder = Array.from(cards());
    const titles = cardsInOrder.map((card) => card.querySelector("strong")?.textContent);
    assert.deepEqual(
      titles,
      defaultIds.map((id) => FIXTURE_STARTERS.find((starter) => starter.id === id)!.title),
    );

    // Every visible title is the FULL title text, never clipped by the
    // component itself (the no-ellipsis CSS is checked separately, visually).
    cardsInOrder.forEach((card, index) => {
      const starter = FIXTURE_STARTERS.find((entry) => entry.id === defaultIds[index])!;
      assert.equal(card.querySelector("strong")?.textContent, starter.title);
      const preview = card.querySelector(".mj-notebooks-starter-preview")?.textContent ?? "";
      assert.equal(preview, `"${briefPreview(starter.brief)}"`);
      assert.ok(preview.length <= 112, "quoted preview stays within the 110-char budget plus the two quote marks");
    });

    const showMore = view.getByRole("button", { name: copy.showMoreBriefs(6) });
    fireEvent.click(showMore);
    await waitFor(() => assert.equal(cards().length, 12));
    // The button counts down to nothing left to reveal, so it disappears
    // rather than sitting there doing nothing.
    assert.equal(view.queryByRole("button", { name: /Show \d+ more briefs?/ }), null);

    const textarea = view.getByRole("textbox", { name: copy.briefLabel }) as HTMLTextAreaElement;
    assert.equal(textarea.value, "");
    const bellCard = Array.from(cards()).find((card) => card.querySelector("strong")?.textContent === "Entanglement, hands on")!;
    fireEvent.click(bellCard);
    assert.equal(textarea.value, FIXTURE_STARTERS.find((starter) => starter.id === "bell-state")!.brief);
  } finally {
    fetchStub.restore();
  }
});

test("a default id the API does not return is skipped, and an id outside the curated six only shows up after Show all", async () => {
  // Drop "hardware-first-job" (one of the curated six) and add an unrecognised
  // id the curated list has never heard of — 12 starters, only 5 of which are
  // in DEFAULT_STARTER_IDS.
  const starters = FIXTURE_STARTERS.filter((starter) => starter.id !== "hardware-first-job").concat([
    {
      id: "future-starter",
      kind: "scratch",
      level: "engineer",
      title: "Some future starter",
      brief: "A brief the curated list has never seen.",
    },
  ]);
  const fetchStub = stubNotebooksAndTemplates(starters);
  try {
    const view = render(<NotebooksHome locale="en" />);
    const cards = () => view.container.querySelectorAll(".mj-notebooks-starter-chip");
    await waitFor(() => assert.equal(cards().length, 5));
    assert.ok(!Array.from(cards()).some((card) => card.querySelector("strong")?.textContent === "Some future starter"));

    // 12 starters in, 5 matched the curated defaults, so 7 are left to reveal.
    fireEvent.click(view.getByRole("button", { name: copy.showMoreBriefs(7) }));
    await waitFor(() => assert.equal(cards().length, 12));
    assert.ok(Array.from(cards()).some((card) => card.querySelector("strong")?.textContent === "Some future starter"));
  } finally {
    fetchStub.restore();
  }
});
