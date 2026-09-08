# Nala experience audit, 2026-09-06

Scope: `/run`, `/run/[taskId]`, the composer, transcript, activity, results and export controls. Baseline `03a0443a`. Worktree `/Users/Eshaan/Developer/majorana-wt-ux-nala`, branch `feature/ux-nala-20260906`. The lead owns shared tokens, navigation and CSS imports. API, auth, execution and verification contracts are unchanged.

The owner requested a complete experience revamp. The shared concept uses warm neutral tokens, a static orbit emblem, a 28px heading, a centered composer and three visible example actions. Text appears immediately. Advanced detail remains available through disclosures.

| Finding and baseline evidence | Planned change | Verification |
| --- | --- | --- |
| Composer placeholder ticks every 12ms and rerenders the full form; home adds a typed greeting and particle canvas (`run-composer.tsx:301`, `run-workspace.tsx:234,327`). | Static prompt, heading and SVG; visible examples; stable input height. | Idle browser render; no typewriter timers or particle canvas on home. |
| Submission and cancellation depend on React state before it commits (`run-workspace.tsx:193`, `live-run.tsx:750`). | Synchronous request guards. | Repeated submit events produce one POST; failure allows retry. |
| Both asynchronous attachment readers close over an older attachment array (`run-workspace.tsx:144`, `live-run.tsx:699`). | One shared attachment hook with atomic merge and a reading state. | Out-of-order file reads retain every accepted file; send waits for reads. |
| Artifact hydration replaces a draft; failed context blocks all later submissions with no recovery (`run-workspace.tsx:97,163`). | Keep edited drafts, abort discarded context and offer removal/recovery. | Delayed hydration preserves input; removal permits submission. |
| Failed outcomes without a result render twice (`live-run.tsx:1003,1010,1120,1128`). | One outcome per response. | Failed fixture has one result status card. |
| Every token re-projects completed turns; closed activity details mount code and chart content (`live-run.tsx:889`, `agent-activity.tsx:145`). | Memoize completed responses and projections; defer unopened detail content. | Completed DOM retains identity; closed details do not mount expensive bodies. |
| Reconnect hides an error after one second before recovery succeeds (`live-run.tsx:621`). | Persistent connection state, bounded backoff and explicit retry. | Offline/reconnect fixture keeps one stable notice until a connection succeeds. |
| Cold history starts with Send enabled and no Stop until hydration (`live-run.tsx:366`). | Separate loading/submission/execution state. | Loading blocks send, a running run exposes Stop, completed history stays usable. |
| Automatic scroll always pins the bottom; no latest control and no documented final-result anchor (`live-run.tsx:450`). | Observe content growth, respect reader position, anchor completed output once, add latest action. | Streaming, manual scroll, terminal hydration and follow-up browser loop. |
| Export has no Copy, no fallback Download and unfocusable source; loading can reuse stale artifact data (`run-code-export.tsx:130,151,206`). | Accessible copy/download in all source states, on-demand conversions, reset/cancel stale loads, memoized diagram. | Clipboard/download, loading/failure fallback and artifact replacement checks. |
| Keep disappears after metadata lookup failure (`live-run.tsx:1926`). | Stable loading area and retry; keep retains exact saved/kept semantics. | Metadata and keep failures recover without losing output. |
| Chart detail depends on hover; long labels compress on mobile (`result-visualization.tsx`). | Labeled data disclosures and responsive chart scroll regions. | Keyboard access, actual numeric data and mobile layout checks. |

Tests and exact final commit are recorded in the lane handoff to the lead. Browser fixtures prove renderer behavior; they do not claim a live backend run occurred.

## Implementation checkpoint

Implemented the listed behavior and apps/web/styles/ux-nala.css. Node24 web typecheck passes;67/67 form tests pass, including11 Nala interaction cases. The failed-output test was corrected to include the actual run.queued execute event so it tests a circuit run. Lead will integrate CSS and complete browser validation against the combined branch. No live backend execution is claimed.
