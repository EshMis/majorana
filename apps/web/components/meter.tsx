import type { ReactNode } from "react";

export type MeterPressure = "ok" | "approaching" | "critical" | "exhausted";

/**
 * A bar that fills as an allowance is used. One component for every allowance
 * on the account page and for the rail, so "how much is left" reads the same
 * everywhere: label on the left, the figure on the right, the bar between.
 *
 * `compact` stacks the bar under the label for a narrow column (the sidebar
 * drawer) and hides it from assistive technology, because the text beside it
 * already carries the number; the full meter is a `progressbar` in its own
 * right. Pressure colours the fill amber from "approaching" onward (the
 * palette's one amber; red is for errors, and a person near a limit has not
 * made one) and is always said in words too, in `sub`.
 */
export function Meter({
  label,
  used,
  limit,
  figure,
  sub,
  pressure = "ok",
  exhausted = false,
  compact = false,
}: {
  label: string;
  used: number;
  /** A positive ceiling; an unmetered allowance has no meter. */
  limit: number;
  /** The figure on the right, e.g. "3 of 5" or "40% used". */
  figure: string;
  sub?: ReactNode;
  pressure?: MeterPressure;
  exhausted?: boolean;
  compact?: boolean;
}) {
  // The fill uses the unrounded ratio so 0.4% is still a sliver; clamped
  // because a tier lowered under an account leaves `used` above `limit`.
  const ratio = limit > 0 ? Math.min(Math.max(used / limit, 0), 1) : 0;
  const percent = Math.round(ratio * 100);
  const state = exhausted ? "exhausted" : pressure;
  const track = (
    <div className="mj-meter-track" {...(compact ? { "aria-hidden": true } : { role: "progressbar", "aria-valuenow": percent, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": label, "aria-valuetext": figure })}>
      <div className="mj-meter-fill" data-exhausted={exhausted} data-pressure={state} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
  return (
    <div className={`mj-meter${compact ? " mj-meter--compact" : ""}`} data-pressure={state}>
      <div>
        <span className="mj-meter-name">{label}</span>
        {sub ? <p className="mj-meter-sub">{sub}</p> : null}
      </div>
      {track}
      <span className="mj-meter-pct">{figure}</span>
    </div>
  );
}
