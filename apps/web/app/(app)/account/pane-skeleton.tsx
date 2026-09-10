/**
 * The shape of a pane before its numbers arrive. Every settings pane that
 * fetches shows this instead of a one-line "Loading…", so the dialog does not
 * jump when the real panel replaces it (owner, 2026-09-10: "weird issues when
 * sections load in").
 */
export function PaneSkeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div className="mj-account-skeleton" role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="mj-account-skeleton-row" key={index}>
          <span className="mj-skeleton" />
          <span className="mj-skeleton" />
        </div>
      ))}
    </div>
  );
}
