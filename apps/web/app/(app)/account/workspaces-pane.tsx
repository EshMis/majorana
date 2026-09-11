"use client";

import type { PublicLocale } from "../../../lib/public-locale";
import { ACCOUNT_COPY } from "../../../lib/workspace-locale";
import { useAccountOverview } from "./account-overview";
import { PaneSkeleton } from "./pane-skeleton";
import { WorkspaceSharing } from "./workspace-sharing";

/** Workspaces and members, as a pane of their own. */
export function WorkspacesPane({ locale }: { locale: PublicLocale }) {
  const copy = ACCOUNT_COPY[locale];
  const { me, workspace, setWorkspace, loading, loadError, reload } = useAccountOverview(copy);
  if (loading) return <PaneSkeleton rows={4} label={copy.loading} />;
  if (!workspace || !me) {
    return (
      <div className="leona-workspace-state">
        <p className="mj-page-lede" role="alert">{loadError ?? copy.unavailable}</p>
        <button className="mj-secondary-button" type="button" onClick={reload}>{copy.retry}</button>
      </div>
    );
  }
  return (
    <div className="mj-artifact-grid">
      <WorkspaceSharing
        locale={locale}
        members={workspace.members}
        viewerUserId={me.user_id}
        viewerRole={me.role}
        onMembersChanged={(members) => setWorkspace((current) => (current ? { ...current, members } : current))}
      />
    </div>
  );
}
