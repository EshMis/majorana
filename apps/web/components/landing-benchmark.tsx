import type { HomeBenchmarkCopy } from "../lib/public-copy";
import { Reveal } from "./reveal";

/**
 * The benchmark section as one dot plot. Every number comes from
 * `HOME_COPY.benchmark`; nothing here is computed from a measurement of its
 * own. LeonaQ is the filled marker with its value; the models the sources
 * report are outlined markers and are listed with their values under each row,
 * so the plot is readable as text, and the same rows sit in a table behind a
 * disclosure for anyone who wants the numbers in one place.
 */
export function LandingBenchmark({ copy }: { copy: HomeBenchmarkCopy }) {
  const format = (score: number) => `${score.toFixed(1)}%`;
  return (
    <section className="mj-company-section lq-bench" aria-labelledby="benchmark-heading">
      <Reveal>
        <div className="lq-site-section-heading">
          <p className="mj-section-label">{copy.label}</p>
          <h2 id="benchmark-heading">{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
      </Reveal>
      <Reveal delay={90}>
        <figure className="lq-bench-figure">
          <div className="lq-bench-legend" aria-hidden="true">
            <span><i className="lq-bench-dot lq-bench-dot--leona" />{copy.leonaLabel}</span>
            <span><i className="lq-bench-dot" />{copy.reportedLabel}</span>
          </div>
          <div className="lq-bench-rows">
            {copy.rows.map((row) => {
              const leona = row.scores.find((score) => score.featured);
              const reported = row.scores.filter((score) => !score.featured);
              return (
                <div className="lq-bench-row" key={row.name}>
                  <div className="lq-bench-name">
                    <strong>{row.name}</strong>
                    {row.detail ? <span>{row.detail}</span> : null}
                  </div>
                  <div className="lq-bench-plot">
                    {/* The plot is decorative: the line under it and the table carry the same
                        numbers as text, so a screen reader hears each figure once. */}
                    <div className="lq-bench-track" aria-hidden="true">
                      {reported.map((score) => (
                        <span className="lq-bench-dot" key={score.model} style={{ left: `${score.score}%` }} title={`${score.model}: ${format(score.score)}`} />
                      ))}
                      {leona ? (
                        <span className="lq-bench-dot lq-bench-dot--leona" style={{ left: `${leona.score}%` }} title={`${leona.model}: ${format(leona.score)}`}>
                          <b>{format(leona.score)}</b>
                        </span>
                      ) : null}
                    </div>
                    <p className="lq-bench-reported">
                      {leona ? <><b>{leona.model} {format(leona.score)}</b> · </> : null}
                      {reported.map((score, index) => (
                        <span key={score.model}>{index ? " · " : ""}{score.model} {format(score.score)}</span>
                      ))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="lq-bench-axis" aria-hidden="true">
            <div><em>{copy.axisLabel}</em></div>
            <div><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          </div>
          <figcaption>
            <p>{copy.note}</p>
            <p className="lq-bench-sources">
              <span>{copy.sourcesLabel}</span>
              {copy.sources.map((source) => (
                <a href={source.href} key={source.href} rel="noreferrer" target="_blank">{source.label} ↗</a>
              ))}
            </p>
          </figcaption>
        </figure>
      </Reveal>
      <details className="lq-bench-table">
        <summary>{copy.tableLabel}</summary>
        <table>
          <thead>
            <tr><th>{copy.tableHeaders.benchmark}</th><th>{copy.tableHeaders.model}</th><th>{copy.tableHeaders.score}</th><th>{copy.tableHeaders.source}</th></tr>
          </thead>
          <tbody>
            {copy.rows.flatMap((row) => row.scores.map((score) => (
              <tr key={`${row.name}-${score.model}`} data-featured={score.featured ? "" : undefined}>
                <td>{row.name}</td>
                <td>{score.model}{score.detail ? <> <span className="lq-fig-muted">{score.detail}</span></> : null}</td>
                <td>{format(score.score)}</td>
                <td>{score.badge}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
