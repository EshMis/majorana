"use client";

import type { components } from "@majorana/contracts-gen";
import { useCallback, useEffect, useState } from "react";

export type WorkspaceOverview = components["schemas"]["WorkspaceOverview"];

export type Me = {
  user_id: string;
  email: string;
  display_name: string | null;
  workspace_id: string;
  workspace_name: string;
  role: components["schemas"]["Role"];
  /** Optional so an older control plane, which had no shared workspaces at all,
   *  still reads as personal rather than as somebody else's. */
  is_personal_workspace?: boolean;
};

export class AccountRequestError extends Error {}

export function errorDetail(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  if ("title" in payload && typeof payload.title === "string") return payload.title;
  if ("error" in payload && typeof payload.error === "string") return payload.error;
  return fallback;
}

export async function parseJson<T>(response: Response, fallback: string): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AccountRequestError(fallback);
  }
  if (!response.ok) {
    throw new AccountRequestError(errorDetail(payload, fallback));
  }
  return payload as T;
}

/**
 * Who is signed in and which workspace is open — read once per pane that needs
 * it (Profile, Workspaces). Two panes, two fetches, only when each is visited.
 */
export function useAccountOverview(copy: { requestFailed: string; unavailable: string }) {
  const [me, setMe] = useState<Me | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      fetch("/api/me", { cache: "no-store" }).then((response) => parseJson<Me>(response, copy.requestFailed)),
      fetch("/api/workspace", { cache: "no-store" }).then((response) => parseJson<WorkspaceOverview>(response, copy.requestFailed)),
    ])
      .then(([identity, overview]) => {
        if (!active) return;
        setMe(identity);
        setWorkspace(overview);
        setLoading(false);
      })
      .catch((cause) => {
        if (!active) return;
        setLoadError(cause instanceof AccountRequestError ? cause.message : copy.unavailable);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [copy, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  return { me, setMe, workspace, setWorkspace, loading, loadError, reload };
}
