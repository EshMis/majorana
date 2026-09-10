"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Meter } from "../../../components/meter";
import { ACCOUNT_TIERS, type AccountTier } from "../../../lib/account-tier";
import type { PublicLocale } from "../../../lib/public-locale";
import { ACCOUNT_COPY } from "../../../lib/workspace-locale";
import {
  describeNextSlot,
  formatTokens,
  formatUsd,
  isMetered,
  parseUsage,
  type UsageSummary,
} from "../../../lib/usage-summary";
import { PaneSkeleton } from "./pane-skeleton";

/**
 * What this account has used of what it is allowed, one bar per allowance.
 *
 * The control plane's `/v1/usage` is the source (it is the service that refuses
 * a submission), read once when the pane opens. Until it answers the pane shows
 * a skeleton the size of the loaded panel, so the dialog does not resize; if it
 * never answers there is one sentence and a retry.
 */
export function UsageNow({
  locale,
  renderedTier,
}: {
  locale: PublicLocale;
  /** The tier the ceilings were rendered from — the WEB app's answer. */
  renderedTier: AccountTier;
}) {
  const copy = ACCOUNT_COPY[locale];
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    void (async () => {
      try {
        const response = await fetch("/api/usage", { cache: "no-store" });
        const summary = response.ok ? parseUsage(await response.json()) : null;
        if (cancelled) return;
        if (summary) {
          setUsage(summary);
          setState("ready");
        } else {
          setState("error");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state === "loading") return <PaneSkeleton rows={4} label={copy.loading} />;
  if (state === "error" || !usage) {
    return (
      <div className="leona-workspace-state">
        <p className="mj-page-lede" role="status">{copy.usageUnavailable}</p>
        <button className="mj-secondary-button" type="button" onClick={() => setAttempt((value) => value + 1)}>{copy.retry}</button>
      </div>
    );
  }

  const metered = isMetered(usage);
  // `tier` is whatever string the control plane sent. Naming a tier this page
  // has no copy for would render "undefined"; an unrecognised one means the two
  // services are further apart than this banner can explain, so it says nothing.
  const enforcedTier = ACCOUNT_TIERS.find((known) => known === usage.tier);
  const slot = metered && usage.runs.nextSlotAt ? describeNextSlot(usage.runs.nextSlotAt, locale) : null;
  const slotLine = slot ? (slot.relative ? copy.usageNextSlotWhen(slot.text) : copy.usageNextSlotOn(slot.text)) : null;
  const ofLimit = (used: number, limit: number) => copy.usageSpent(used, limit);

  const tokens = usage.tokens;
  const tokenSlot = tokens?.nextSlotAt ? describeNextSlot(tokens.nextSlotAt, locale) : null;
  const tokenReset = tokenSlot ? (tokenSlot.relative ? copy.meterResetsWhen(tokenSlot.text) : copy.meterResetsOn(tokenSlot.text)) : null;
  const tokenWarning = tokens && tokens.limit !== null
    ? tokens.pressure === "exhausted" || tokens.exhausted
      ? copy.meterExhausted
      : tokens.pressure === "critical"
        ? copy.meterCritical(formatTokens(tokens.remaining ?? 0, locale))
        : tokens.pressure === "approaching"
          ? copy.meterApproaching(formatTokens(tokens.remaining ?? 0, locale))
          : null
    : null;
  const tokenWarned = Boolean(tokens && (tokens.pressure !== "ok" || tokens.exhausted));

  return (
    <div className="mj-usage-now">
      {enforcedTier && enforcedTier !== renderedTier ? (
        <p className="mj-usage-now-conflict">{copy.usageEnforcedAs(copy.tierNames[enforcedTier])}</p>
      ) : null}
      <div className="mj-meters">
        {tokens ? (
          tokens.limit === null ? (
            <UnmeteredRow label={copy.meterTokens} note={copy.meterTokensUnmetered} />
          ) : (
            <Meter
              label={copy.meterTokens}
              used={tokens.used}
              limit={tokens.limit}
              figure={copy.meterAmount(formatTokens(tokens.used, locale), formatTokens(tokens.limit, locale))}
              pressure={tokens.pressure}
              exhausted={tokens.exhausted}
              sub={
                <>
                  {tokenWarning ?? tokenReset}
                  {tokens.runsEquivalent === null ? null : <> · {copy.meterTokensRuns(tokens.runsEquivalent)}</>}
                  {tokenWarned ? <> · <Link href="/upgrade">{copy.meterUpgradeHint}</Link></> : null}
                </>
              }
            />
          )
        ) : null}
        {usage.runs.limit === null ? (
          <UnmeteredRow label={copy.usageRuns} note={copy.usageSpentUnmetered(usage.runs.used)} />
        ) : (
          <Meter
            label={copy.usageRuns}
            used={usage.runs.used}
            limit={usage.runs.limit}
            figure={ofLimit(usage.runs.used, usage.runs.limit)}
            pressure={usage.runs.pressure}
            exhausted={usage.runs.exhausted}
            sub={<>{copy.usageWindow(usage.runs.windowDays)}{slotLine ? <> · {slotLine}</> : null}</>}
          />
        )}
        {usage.artifacts.limit === null ? (
          <UnmeteredRow label={copy.usageStorage} note={copy.usageSpentUnmetered(usage.artifacts.used)} />
        ) : (
          <Meter label={copy.usageStorage} used={usage.artifacts.used} limit={usage.artifacts.limit} figure={ofLimit(usage.artifacts.used, usage.artifacts.limit)} pressure={usage.artifacts.pressure} exhausted={usage.artifacts.exhausted} sub={copy.usageArtifactsScope} />
        )}
        {usage.workspaces.limit === null ? (
          <UnmeteredRow label={copy.usageWorkspaces} note={copy.usageSpentUnmetered(usage.workspaces.used)} />
        ) : (
          <Meter label={copy.usageWorkspaces} used={usage.workspaces.used} limit={usage.workspaces.limit} figure={ofLimit(usage.workspaces.used, usage.workspaces.limit)} pressure={usage.workspaces.pressure} exhausted={usage.workspaces.exhausted} />
        )}
        {usage.sharedProjects ? (
          usage.sharedProjects.limit === 0 ? (
            <UnmeteredRow label={copy.usageSharedProjects} note={copy.usageSharedProjectsNone} />
          ) : usage.sharedProjects.limit === null ? (
            <UnmeteredRow label={copy.usageSharedProjects} note={copy.usageSpentUnmetered(usage.sharedProjects.used)} />
          ) : (
            <Meter label={copy.usageSharedProjects} used={usage.sharedProjects.used} limit={usage.sharedProjects.limit} figure={ofLimit(usage.sharedProjects.used, usage.sharedProjects.limit)} pressure={usage.sharedProjects.pressure} exhausted={usage.sharedProjects.exhausted} sub={copy.usageSharedProjectsScope} />
          )
        ) : null}
        {usage.hardwareSpend ? (
          usage.hardwareSpend.limitUsd === null ? (
            <UnmeteredRow label={copy.usageHardware} note={copy.usageHardwareAuthorized(formatUsd(usage.hardwareSpend.usedUsd, locale), usage.hardwareSpend.windowDays)} />
          ) : usage.hardwareSpend.limitUsd === 0 ? (
            <UnmeteredRow label={copy.usageHardware} note={copy.usageHardwareFreeQueuesOnly} />
          ) : (
            <Meter
              label={copy.usageHardware}
              used={usage.hardwareSpend.usedUsd}
              limit={usage.hardwareSpend.limitUsd}
              figure={copy.meterAmount(formatUsd(usage.hardwareSpend.usedUsd, locale), formatUsd(usage.hardwareSpend.limitUsd, locale))}
              exhausted={usage.hardwareSpend.exhausted}
              pressure={usage.hardwareSpend.exhausted ? "exhausted" : "ok"}
              sub={usage.hardwareSpend.exhausted ? copy.usageHardwareExhausted(formatUsd(usage.hardwareSpend.limitUsd, locale)) : copy.usageHardwareAuthorized(formatUsd(usage.hardwareSpend.usedUsd, locale), usage.hardwareSpend.windowDays)}
            />
          )
        ) : null}
      </div>
      {usage.spend && usage.spend.total.tokens > 0 ? (
        <details className="mj-usage-spend">
          <summary>{copy.spendTitle} · {copy.spendScope(usage.spend.windowDays)}</summary>
          <table className="mj-usage-spend-table">
            <tbody>
              <tr><th>{copy.spendChat}</th><td>{copy.spendTokens(formatTokens(usage.spend.chat.tokens, locale), usage.spend.chat.calls)}</td></tr>
              <tr><th>{copy.spendRuns}</th><td>{copy.spendTokens(formatTokens(usage.spend.runs.tokens, locale), usage.spend.runs.calls)}</td></tr>
              <tr><th>{copy.spendTotal}</th><td>{copy.spendTokens(formatTokens(usage.spend.total.tokens, locale), usage.spend.total.calls)}</td></tr>
              {/* The model ids as the provider reported them, so a person can
                  compare against the provider's own console. */}
              {usage.spend.byModel.map((entry) => (
                <tr key={entry.model}><th>{entry.model || copy.spendUnattributed}</th><td>{formatTokens(entry.tokens, locale)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mj-usage-spend-note">{copy.spendNotBilled}</p>
        </details>
      ) : null}
    </div>
  );
}

/** An allowance with no ceiling: the label and one sentence, no bar. */
function UnmeteredRow({ label, note }: { label: string; note: string }) {
  return (
    <div className="mj-meter mj-meter--unmetered">
      <div><span className="mj-meter-name">{label}</span></div>
      <p className="mj-meter-unmetered">{note}</p>
    </div>
  );
}
