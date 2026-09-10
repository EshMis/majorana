// Whose claim is the speedup class: `/repository/claims`.
//
// ## What this page is for
//
// Every Zoo-parity record shows a speedup class, and that class is a quotation
// from a secondary index rather than something this repository derived. The
// owner's ruling on that (EshMis/ai-ops#18) was to keep the classes, keep
// track of which are second-hand, and prefer the primary source wherever it can
// be found. This page is where that tracking becomes readable, checked against
// each record's own paper -- not against the index that supplied the class.
//
// Seven records now say the primary source does **not** state the class. That was
// the finding, and it lived only inside each record's caveat and inside a lint
// script's census comment -- reachable by nobody.
//
// ## Two rules the layout follows
//
// **The denominator is the first sentence, and the finding is second.** "Seven
// records disagree" reads as seven out of seven unless the unchecked
// majority is on the page beside them. `speedupClaimCensus` has no accessor that
// returns the finding without the rest, so this ordering cannot quietly rot.
//
// **One census sentence, not a stat grid.** The owner has already said, of the
// Atlas description, the information card and the Papers index: *"I don't like
// all the numbers"*. So the counts appear in prose once and never again.
//
// ## Server component, every affordance an href
//
// Same rule as the Layers and Papers surfaces: a control that only works after
// hydration has no address. Everything here answers to `curl`.
import type { PublicLocale } from "../lib/public-locale";
import {
  speedupCensusSentence,
  type SpeedupAbsentRow,
  type SpeedupClaimCensus,
  type SpeedupClaimRow,
  type SpeedupReportedRow,
} from "../lib/repository/speedup-claims";

type ClaimStatus = "reported" | "absent" | "unchecked";

const COPY = {
  en: {
    title: "Whose claim is the speedup",
    lede: "Every algorithm record's speedup class is checked against that record's own primary paper.",
    backToAtlas: "The Quantum Atlas",
    papersLink: "Papers — every source behind the Quantum Atlas and the Map",
    absentHeading: "Checked, and the paper does not state it",
    absentLede:
      "Each row is the narrow claim that a specific paper does not contain a specific result, not that the"
      + " class itself is wrong.",
    reportedHeading: "Checked, and the paper states it",
    reportedLede: "The source's own words, not a paraphrase.",
    uncheckedHeading: "Not checked against the primary source",
    uncheckedLede: "Nobody has checked these records' papers against the class shown yet, so they are listed rather than counted.",
    classLabel: "Speedup class",
    paperSays: "The paper behind it",
    read: "What was read",
    noneAbsent: "No record has been checked and found unsupported.",
    noneUnchecked: "Every record has been checked against its primary source.",
    status: {
      reported: "paper agrees",
      absent: "paper does not state it",
      unchecked: "not yet checked",
    } satisfies Record<ClaimStatus, string>,
  },
  ja: {
    title: "速度向上は誰の主張か",
    lede: "アルゴリズムの記録が掲げる速度向上の区分は、それぞれの記録の一次資料と照合しています。",
    backToAtlas: "量子アトラス",
    papersLink: "論文 — 量子アトラスと地図の背後にあるすべての資料",
    absentHeading: "照合の結果、論文に記載がなかったもの",
    absentLede: "いずれも、特定の論文に特定の結果が含まれていないという限定的な主張であり、区分そのものが誤りだという主張ではありません。",
    reportedHeading: "照合の結果、論文に記載があったもの",
    reportedLede: "言い換えではなく、資料自身の言葉です。",
    uncheckedHeading: "一次資料と未照合のもの",
    uncheckedLede: "これらの記録については、示されている区分と論文との照合がまだ行われていないため、件数ではなく一覧として示します。",
    classLabel: "速度向上の区分",
    paperSays: "根拠となる論文",
    read: "読んだ範囲",
    noneAbsent: "照合の結果、裏づけを欠くと判明した記録はありません。",
    noneUnchecked: "すべての記録が一次資料と照合済みです。",
    status: {
      reported: "論文と一致",
      absent: "論文に記載なし",
      unchecked: "未照合",
    } satisfies Record<ClaimStatus, string>,
  },
} as const;

/** Title (linked to the record), year, class and status -- everything a
 * reader needs to place a row, on one line. */
function RowSummary({
  row,
  status,
  locale,
}: {
  row: SpeedupClaimRow;
  status: ClaimStatus;
  locale: PublicLocale;
}) {
  const copy = COPY[locale];
  return (
    <p className="mj-papers-list-meta">
      <a className="mj-papers-list-title" href={`/repository/${row.slug}`}>
        {locale === "ja" ? row.titleJa : row.title}
      </a>
      {" · "}
      {row.source.year}
      {" · "}
      {copy.classLabel}: {row.speedup}
      {" · "}
      <span className="mj-papers-chip" data-status={status}>
        {copy.status[status]}
      </span>
    </p>
  );
}

/** "The paper behind it" -- a real link to the source, not a name in text. */
function PaperLink({ row, locale }: { row: SpeedupClaimRow; locale: PublicLocale }) {
  const copy = COPY[locale];
  return (
    <p className="mj-papers-list-meta">
      {copy.paperSays}: <a className="mj-papers-source-link" href={row.source.url}>{row.source.title}</a>
    </p>
  );
}

export function SpeedupClaimsView({
  census,
  locale,
}: {
  census: SpeedupClaimCensus;
  locale: PublicLocale;
}) {
  const copy = COPY[locale];
  return (
    <article className="mj-layers-index mj-papers-index">
      <nav className="mj-layers-breadcrumb" aria-label={copy.title}>
        <a href="/repository">{copy.backToAtlas}</a>
      </nav>
      <header className="mj-layers-node-head">
        <h1>{copy.title}</h1>
        <p>{copy.lede}</p>
      </header>
      {/* The one place counts appear. Everything below is named rather than
          tallied — see the header for why. */}
      <section className="mj-papers-census" aria-label={copy.title}>
        <p className="mj-layers-empty">{speedupCensusSentence(census, locale)}</p>
      </section>

      <section aria-labelledby="mj-claims-absent">
        <h2 id="mj-claims-absent">{copy.absentHeading}</h2>
        <p className="mj-layers-empty">{copy.absentLede}</p>
        {/* Unreachable while records say `absent`, and written anyway: an
            empty list and a failed load render identically, and the reader cannot
            tell which they are looking at. */}
        {census.absent.length === 0 ? <p className="mj-layers-empty">{copy.noneAbsent}</p> : null}
        <ul className="mj-papers-list">
          {census.absent.map((row: SpeedupAbsentRow) => (
            <li key={row.slug}>
              <RowSummary row={row} status="absent" locale={locale} />
              <PaperLink row={row} locale={locale} />
              <details className="mj-claims-read">
                <summary>{copy.read}</summary>
                <p>{row.read}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mj-claims-reported">
        <h2 id="mj-claims-reported">{copy.reportedHeading}</h2>
        <p className="mj-layers-empty">{copy.reportedLede}</p>
        <ul className="mj-papers-list">
          {census.reported.map((row: SpeedupReportedRow) => (
            <li key={row.slug}>
              <RowSummary row={row} status="reported" locale={locale} />
              <PaperLink row={row} locale={locale} />
              <blockquote className="mj-papers-list-meta">{row.quote}</blockquote>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mj-claims-unchecked">
        <h2 id="mj-claims-unchecked">{copy.uncheckedHeading}</h2>
        <p className="mj-layers-empty">{copy.uncheckedLede}</p>
        {census.unchecked.length === 0 ? (
          <p className="mj-layers-empty">{copy.noneUnchecked}</p>
        ) : null}
        <ul className="mj-papers-list">
          {census.unchecked.map((row) => (
            <li key={row.slug}>
              <RowSummary row={row} status="unchecked" locale={locale} />
              <PaperLink row={row} locale={locale} />
            </li>
          ))}
        </ul>
      </section>

      <nav className="mj-layers-breadcrumb" aria-label={copy.papersLink}>
        <a href="/repository/papers">{copy.papersLink}</a>
      </nav>
    </article>
  );
}
