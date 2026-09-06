/**
 * Which downloads a viewer may take of a notebook version.
 *
 * A pure rule in `lib/` rather than an expression inside the workspace component, for
 * the same reason `notebook-grades.ts` and `notebook-mastery.ts` are: the component is a
 * fetch-driven page that is expensive to stand up in a test, and the interesting part is
 * a decision about who sees what, which deserves to be checked directly.
 *
 * The server decides this too, and independently — `?build=solution` is refused with 403
 * for anyone who is not the author, whatever the browser sends. This module only decides
 * whether to OFFER the button. A control that is hidden but would work is a nuisance; a
 * control that is shown but 403s is worse.
 */
import type { components } from "@majorana/contracts-gen";

type Notebook = components["schemas"]["Notebook"];

/** Kinds whose reader build differs from the author's, i.e. whose answers are redacted. */
const REDACTED_KINDS: ReadonlyArray<Notebook["kind"]> = ["challenge", "quiz"];

/**
 * Whether to offer "download with answers".
 *
 * Both halves are required. **The viewer wrote it** — owner ruling ai-ops 260, option 1,
 * and the server enforces the same rule. **And its reader copy is actually redacted** —
 * on a lesson the two downloads are byte-identical, so a second button there offers a
 * choice with no difference, which teaches a reader that the label means nothing.
 *
 * `viewerId` is null until `/api/me` answers. Returning false meanwhile makes the button
 * appear a moment late rather than appear wrongly and then vanish.
 */
export function canDownloadSolutions(
  notebook: Notebook | null | undefined,
  viewerId: string | null | undefined,
): boolean {
  if (!notebook || !viewerId) return false;
  if (notebook.owner_user_id !== viewerId) return false;
  return REDACTED_KINDS.includes(notebook.kind);
}
