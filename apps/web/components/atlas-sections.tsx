/**
 * The section chrome every Atlas surface draws: a row of section names, one
 * section shown under it, the rest in the document and `hidden`, and a gap
 * sentence where a section holds nothing.
 *
 * Lifted out of `map-card-panel.tsx` in the 2026-09-10 Atlas pass, when the
 * owner asked for the record page to *"match exactly how the cards look like
 * when clicked into on the map"*. The card keeps every decision it made — the
 * reasoning is still in that file, beside the wrappers that call these — and the
 * record page draws the same markup by calling the same functions, which is the
 * only way "exactly" stays true after either of them changes.
 *
 * Nothing here knows what a section holds. The card and the record page each
 * decide that; this file decides only how a name, a body and a gap are drawn.
 */
import type { ReactNode } from "react";
import type { CardGap } from "../lib/repository/card-content";
import { MathText } from "./math-text";

/** The two gap sentences, in one locale. */
export interface AtlasGapWords {
  readonly noneFound: string;
  readonly noField: string;
}

/** One name in the row: the section's id, its label, and whether it holds anything. */
export interface AtlasNavItem {
  readonly id: string;
  readonly label: string;
  readonly held: boolean;
}

/**
 * The id of one name in the row — what names the section below to a screen
 * reader, so the section can be drawn without a heading over it. `prefix` keeps
 * two surfaces on one page apart; a card and a record page never share one.
 */
export function atlasNavItemId(prefix: string, id: string): string {
  return `${prefix}-nav-${id}`;
}

/**
 * The gap sentence. A declared reason outranks the standing sentence, and it
 * goes through `MathText` because a reason can carry mathematics — the card's
 * `backward-euler` names a Padé order in one.
 */
export function AtlasGap({
  gap,
  words,
  note,
}: {
  gap: CardGap;
  words: AtlasGapWords;
  note?: string;
}): React.ReactElement {
  return (
    <p
      className={`mj-card-gap mj-card-gap--${gap}`}
      data-gap={gap}
      // So a sweep counts the accounted gaps apart from the unexplained ones.
      data-explained={note === undefined ? undefined : "true"}
    >
      {note !== undefined ? <MathText source={note} /> : gap === "none-recorded" ? words.noneFound : words.noField}
    </p>
  );
}

/**
 * One section: named by the row item above it, drawn without a heading, and
 * `hidden` unless it is the one showing. `children` is discarded when the
 * section holds nothing, which is right — a body written for held content must
 * not render against a value that is not there; `whenEmpty` is the slot for
 * what should draw under the gap sentence instead.
 */
export function AtlasSection({
  id,
  held,
  gap = "none-recorded",
  reason,
  note,
  showing,
  labelledBy,
  words,
  whenEmpty,
  children,
}: {
  id: string;
  held: boolean;
  gap?: CardGap;
  /** The record's own reason for the gap, when it states one. */
  reason?: string;
  /** A note about the surface rather than the sources; wins over `reason`. */
  note?: string;
  showing: boolean;
  labelledBy: string;
  words: AtlasGapWords;
  whenEmpty?: ReactNode;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <section
      className={`mj-card-section${held ? "" : " mj-card-section--empty"}`}
      data-section={id}
      aria-labelledby={labelledBy}
      hidden={!showing}
    >
      <div className="mj-card-section-body">
        {held ? (
          children
        ) : (
          <>
            <AtlasGap gap={gap} words={words} note={note ?? reason} />
            {whenEmpty}
          </>
        )}
      </div>
    </section>
  );
}

/**
 * The row of section names. Links, not buttons: each is an address, and the
 * one showing is drawn as a name with `aria-current`. It wraps rather than
 * scrolling sideways, so a reader sees every state at once, and an empty
 * section keeps its name and reads quieter.
 *
 * `onSelect` is for a surface that can switch sections without a round trip.
 * The address still goes into the link, so a reader with JavaScript off, a
 * crawler and `curl` all get the same page the card gives them.
 */
export function AtlasSectionNav({
  prefix,
  items,
  showing,
  hrefFor,
  label,
  onSelect,
}: {
  prefix: string;
  items: readonly AtlasNavItem[];
  showing: string | undefined;
  hrefFor: (id: string) => string | undefined;
  label: string;
  onSelect?: (id: string) => void;
}): React.ReactElement {
  return (
    <nav className="mj-card-nav" aria-label={label}>
      {items.map((item) => {
        const className = `mj-card-nav-item${item.held ? "" : " mj-card-nav-item--empty"}`;
        const href = hrefFor(item.id);
        // A name with no address is drawn as a name: the addresses are built
        // from this same list, so a missing one cannot happen, and if it ever
        // does an unclickable word is the truthful drawing of it.
        return item.id === showing || href === undefined ? (
          <span
            key={item.id}
            className={item.id === showing ? `${className} is-showing` : className}
            id={atlasNavItemId(prefix, item.id)}
            aria-current={item.id === showing ? "true" : undefined}
          >
            {item.label}
          </span>
        ) : (
          <a
            key={item.id}
            className={className}
            id={atlasNavItemId(prefix, item.id)}
            href={href}
            onClick={
              onSelect === undefined
                ? undefined
                : (event) => {
                    // A modified click keeps its browser meaning (new tab).
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                    event.preventDefault();
                    onSelect(item.id);
                  }
            }
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
