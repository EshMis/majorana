"use client";

import { type FormEvent, useState } from "react";
import type { PublicLocale } from "../../../lib/public-locale";
import { ACCOUNT_COPY, SHARING_COPY } from "../../../lib/workspace-locale";
import { AccountRequestError, errorDetail, type Me, useAccountOverview } from "./account-overview";
import { PaneSkeleton } from "./pane-skeleton";

/**
 * The Profile pane: who you are, and the workspace you have open. Workspaces
 * and members moved to a pane of their own (owner, 2026-09-10: the old
 * "Identity" pane stacked five panels under one label).
 */
export function AccountSettings({ initialEmail, locale }: { initialEmail: string; locale: PublicLocale }) {
  const copy = ACCOUNT_COPY[locale];
  const { me, setMe, workspace, loading, loadError, reload } = useAccountOverview(copy);
  // `null` means "not edited yet": the field shows the loaded record until the
  // reader types, and a re-render never resets what they typed. This used to be
  // seeded by an effect on `me`, and on a slow CI box the passive effect ran
  // AFTER the test had typed a new name, so the save sent the old one — the
  // same reset a reader would get if the record re-rendered while they typed.
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoKeep, setAutoKeep] = useState<boolean | null>(null);
  const [savingAutoKeep, setSavingAutoKeep] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ message: string; error?: boolean } | null>(null);
  const [workspaceFeedback, setWorkspaceFeedback] = useState<{ message: string; error?: boolean } | null>(null);

  const shownName = displayName ?? me?.display_name ?? "";
  const autoKeepOn = autoKeep ?? Boolean(workspace?.workspace.auto_keep_artifacts);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setProfileFeedback(null);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: shownName }),
      });
      let payload: Me | { title?: string; error?: string };
      try {
        payload = (await response.json()) as Me | { title?: string; error?: string };
      } catch {
        throw new AccountRequestError(copy.profileSaveFailed);
      }
      if (!response.ok || !("user_id" in payload)) {
        throw new AccountRequestError(errorDetail(payload, copy.profileSaveFailed));
      }
      setMe(payload);
      // Back to the record: the saved name is now what `me` holds.
      setDisplayName(null);
      setProfileFeedback({ message: copy.profileSaved });
    } catch (cause) {
      setProfileFeedback({ message: cause instanceof AccountRequestError ? cause.message : copy.profileSaveFailed, error: true });
    } finally {
      setSaving(false);
    }
  }

  async function saveAutoKeep(next: boolean) {
    if (savingAutoKeep) return;
    setSavingAutoKeep(true);
    setAutoKeep(next);
    setWorkspaceFeedback(null);
    try {
      const response = await fetch("/api/workspace/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_keep_artifacts: next }),
      });
      if (!response.ok) throw new AccountRequestError(copy.autoKeepFailed);
      setWorkspaceFeedback({ message: next ? copy.autoKeepOn : copy.autoKeepOff });
    } catch (cause) {
      setAutoKeep(!next);
      setWorkspaceFeedback({ message: cause instanceof AccountRequestError ? cause.message : copy.autoKeepFailed, error: true });
    } finally {
      setSavingAutoKeep(false);
    }
  }

  if (loading) return <PaneSkeleton rows={3} label={copy.loading} />;
  if (!workspace || !me) {
    return (
      <div className="leona-workspace-state">
        <p className="mj-page-lede" role="alert">{loadError ?? copy.unavailable}</p>
        <button className="mj-secondary-button" type="button" onClick={reload}>{copy.retry}</button>
      </div>
    );
  }

  const sharing = SHARING_COPY[locale];
  // `kind === "personal"` is NOT the test: a guest in someone else's personal
  // workspace reads kind=personal for a tenant that is not theirs.
  const isPersonal = me.is_personal_workspace !== false;
  const memberCount = workspace.members.length;
  const initial = (me.display_name || me.email || initialEmail).trim().charAt(0).toUpperCase();

  return (
    <div className="mj-artifact-grid">
      <section className="mj-artifact-panel">
        <div className="mj-panel-heading"><h2>{copy.profile}</h2><span className="mj-mono-muted">{me.role}</span></div>
        <div className="mj-account-profile">
          <span className="mj-avatar mj-avatar--large" aria-hidden="true">{initial}</span>
          <dl className="mj-resource-list">
            <div><dt>{copy.email}</dt><dd>{me.email}</dd></div>
            <div><dt>{copy.workspace}</dt><dd>{me.workspace_name}</dd></div>
          </dl>
        </div>
        <form className="mj-account-profile-form" onSubmit={saveProfile}>
          <label>
            <span>{copy.displayName}</span>
            <input name="displayName" autoComplete="name" value={shownName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} placeholder={copy.yourName} disabled={saving} />
          </label>
          <button className="mj-primary-button" disabled={saving} type="submit">{saving ? copy.saving : copy.saveName}</button>
        </form>
        {profileFeedback ? <p className="leona-workspace-feedback" role={profileFeedback.error ? "alert" : "status"}>{profileFeedback.message}</p> : null}
      </section>
      {/* Titled by the workspace once there can be more than one: the counts
          below are the ACTIVE workspace's, and heading them "Personal
          workspace" while sitting in a colleague's would misattribute their
          artifacts to you. */}
      <section className="mj-artifact-panel">
        <div className="mj-panel-heading"><h2>{isPersonal ? copy.personalWorkspace : me.workspace_name}</h2><span className="mj-mono-muted">{workspace.workspace.plan}</span></div>
        <dl className="mj-resource-list mj-resource-list--row">
          <div><dt>{copy.artifacts}</dt><dd>{workspace.artifact_count}</dd></div>
          <div><dt>{copy.runs}</dt><dd>{workspace.run_count}</dd></div>
          <div><dt>{copy.access}</dt><dd>{memberCount > 1 ? sharing.sharedWith(memberCount) : copy.privateAccess}</dd></div>
        </dl>
        {/* Optimistic, and reverted on failure: the checkbox is the only
            feedback there is, so leaving it in the state the user clicked while
            the request fails would be a lie. */}
        <label className="mj-account-toggle">
          <input
            type="checkbox"
            checked={autoKeepOn}
            disabled={savingAutoKeep}
            onChange={(event) => saveAutoKeep(event.target.checked)}
          />
          <span>
            <strong>{copy.autoKeep}</strong>
            <small>{copy.autoKeepHelp}</small>
          </span>
        </label>
        {workspaceFeedback ? <p className="leona-workspace-feedback" role={workspaceFeedback.error ? "alert" : "status"}>{workspaceFeedback.message}</p> : null}
      </section>
    </div>
  );
}
