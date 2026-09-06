import { NextResponse } from "next/server";
import { getMajoranaAuth } from "../../../../../lib/auth";
import { controlPlaneUnavailable, controlPlaneUrl, fetchControlPlane } from "../../../../../lib/control-plane";

export const dynamic = "force-dynamic";

/**
 * This reader's own last score on the notebook — `NotebookGradesSnapshot | null`.
 *
 * Owner ruling ai-ops issue 260, option 1: a learner's score is kept. The verdicts were
 * always durable (grading writes `notebook.grades` to `run_events`); nothing read
 * them back, so a reader who closed the tab lost a score that was in the database
 * the whole time.
 *
 * A pass-through like every other notebook route. The control plane filters to the
 * requesting user — a colleague's pass on the same notebook is not this reader's
 * score — and this route must never widen that by caching or by sharing a response
 * between sessions, which is why it is `force-dynamic`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ notebookId: string }> },
) {
  const [{ accessToken }, { notebookId }] = await Promise.all([
    getMajoranaAuth({ ensureSignedIn: true }),
    params,
  ]);
  try {
    const upstream = await fetchControlPlane(
      controlPlaneUrl(`/v1/notebooks/${encodeURIComponent(notebookId)}/grades`),
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (error) {
    return controlPlaneUnavailable(error);
  }
}
