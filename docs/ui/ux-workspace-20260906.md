# Workspace UX, September 6, 2026

The workspace keeps its main task visible, groups optional controls, and distinguishes unavailable data from confirmed failures. This lane covers Studio, notebooks and courses, Qapps, account settings, upgrade, and project sharing. The lead integrates the shared shell and imports `apps/web/styles/ux-workspace.css` from the root document.

## Behavior

- Studio waits for the circuit list before rendering its empty state. Cached circuits remain available after a sync failure, with a retry action. Qapp creation is a collapsed disclosure beside the circuit editor.
- Notebook and course creation keep the brief and primary action visible. Starters, options, and source material are collapsed. Import is a keyboard accessible button; creation and import share a synchronous submission lock. Both lists offer retry after fetch failures.
- Notebook versions show loading and retry states. A returned version must match the selected notebook and sequence before it renders. Late notebook, history, and conversation responses cannot replace the current view. Version loading disables export. Editing, downloads, comparison, and quiz actions are grouped; background refresh preserves an in-progress title. Busy generation disables cell actions, and submitting a practice attempt preserves its text for reopening.
- Course details offer retries for the course and discussion, preserve a title being edited during refresh, and label progress bars with completed and total module counts. Empty discussion and syllabus copy waits for the relevant load to finish.
- Qapp lists and details offer retry. Publishing has a visible success message and a direct path back to the list. The runtime polls the accepted execution until the server reports a terminal state. A lost status request preserves the job identity and offers Retry status; it does not report a failed execution or permit another submission over the pending one.
- Account panes mount on first visit and remain mounted to preserve drafts. Profile and workspace failures appear beside the control that failed. Billing keeps policy details in a disclosure, with contact and plan links above it.
- Studio panel tabs use roving focus and Left, Right, Home, and End navigation. Project sharing traps Tab, supports Escape, returns focus to its opener, and distinguishes an explicit access refusal from a network error. Shared projects keep loaded content and drafts visible during transient refresh errors.
- Responsive styles reduce form density, keep options from stretching, let controls wrap, and stack notebook discussion at narrower widths. They use existing tokens and introduce no animation or decorative data.

## Validation

Run from `/Users/Eshaan/Developer/majorana-wt-ux-workspace` with Node 24 on PATH. All shell commands use `rtk`.

| Check | Result |
| --- | --- |
| Web typecheck | Pass |
| Web lint | Pass; existing corpus math warnings remain |
| Web form suite | 59 passed, 0 failed |
| Project sharing, account pane selection, Studio discovery, notebook editing, course progress unit tests | 94 passed, 0 failed |
| Diff whitespace check | Pass |
| Browser check | Pending in the next validation step on localhost:4313 |

The new Qapp regressions follow a job through 165 status checks and recover a failed status request against the same execution ID with exactly one submission. Sharing tests distinguish 503 responses from explicit 404 access loss. Profile tests require failed saves to announce an alert beside the profile form.

No production deployment, live payment change, hardware execution, or generated notebook run is claimed by these checks. Browser fixture results and screenshots will be added after the local interaction pass.
