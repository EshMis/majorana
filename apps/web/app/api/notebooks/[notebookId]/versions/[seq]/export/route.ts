import { NextResponse } from "next/server";
import { getMajoranaAuth } from "../../../../../../../lib/auth";
import { controlPlaneUnavailable, controlPlaneUrl, fetchControlPlane } from "../../../../../../../lib/control-plane";

export const dynamic = "force-dynamic";

/**
 * The `.ipynb` download. Streamed through as-is — the control plane names the
 * file (`Content-Disposition`) and its type (`Content-Type`); this route adds
 * nothing and reinterprets nothing, it only carries the session's bearer token
 * to an otherwise-unauthenticated proxy call.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ notebookId: string; seq: string }> },
) {
  const { notebookId, seq } = await params;
  const { accessToken } = await getMajoranaAuth({ ensureSignedIn: true });
  // `build` is forwarded BY NAME, not by passing the query string through. This route
  // proxies to the control plane with the session's bearer token, so anything copied
  // across is something a caller got to put in front of an authenticated request — an
  // allowlist of one is the whole of what this feature needs.
  //
  // It was dropped entirely at first: the URL was built from `params` alone and the
  // request was named `_request`, so "Download with answers" sent `build=solution`, the
  // proxy discarded it, and the author received the redacted build with no error and a
  // filename that said solutions. A button that silently returns the wrong file is worse
  // than the missing button it replaced. Greptile, PR 840.
  const build = new URL(request.url).searchParams.get("build");
  const query = build === "solution" ? "?build=solution" : "";
  try {
    const upstream = await fetchControlPlane(
      controlPlaneUrl(
        `/v1/notebooks/${encodeURIComponent(notebookId)}/versions/${encodeURIComponent(seq)}/export.ipynb${query}`,
      ),
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const headers: Record<string, string> = {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/x-ipynb+json",
    };
    const disposition = upstream.headers.get("Content-Disposition");
    if (disposition) headers["Content-Disposition"] = disposition;
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return controlPlaneUnavailable(error);
  }
}
