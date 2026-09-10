"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { LandingCircuit } from "./landing-circuit";
import { ProductGlyph } from "./product-glyph";
import type { PublicLocale } from "../lib/public-locale";

export type HowItWorksStage = {
  /** Which illustration the stage draws; one per surface. */
  figure: "nala" | "studio" | "atlas" | "notebooks" | "qapps";
  title: string;
  body: string;
  link: string;
};

export type HowItWorksCopy = {
  label: string;
  title: string;
  lede: string;
  flowLabel: string;
  stages: HowItWorksStage[];
};

export type HowItWorksItem = { title: string; href: string };

/** How long a stage stays before the rail moves on by itself, in ms. Matches `--lq-flow-dwell`. */
export const STAGE_DWELL_MS = 6000;

/**
 * The five surfaces as one connected diagram: nodes on a rail, and under them
 * the stage the selected node opens into — what it does, in one or two
 * sentences, with a small drawing and the way in.
 *
 * The rail advances on its own every `STAGE_DWELL_MS` so a newcomer sees the
 * whole loop without doing anything; it stops the moment the reader takes over
 * (a click or a key), while the pointer or focus is on it, while the section is
 * off screen or the tab hidden, and never under reduced motion. Every stage is
 * in the document, one shown, so the section reads without JavaScript.
 */
export function HowItWorks({
  copy,
  items,
  locale,
}: {
  copy: HowItWorksCopy;
  items: HowItWorksItem[];
  locale: PublicLocale;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const section = useRef<HTMLElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = Math.min(copy.stages.length, items.length);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const element = section.current;
    const sync = () => setOnScreen((current) => current && document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", sync);
    if (!element || !window.IntersectionObserver) return () => document.removeEventListener("visibilitychange", sync);
    const observer = new IntersectionObserver(([entry]) => {
      setOnScreen(Boolean(entry?.isIntersecting) && document.visibilityState !== "hidden");
    }, { threshold: 0.25 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const playing = auto && !hovering && onScreen && !reduceMotion && count > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setActive((current) => (current + 1) % count), STAGE_DWELL_MS);
    return () => clearInterval(timer);
  }, [playing, count, active]);

  function choose(index: number, focus = false) {
    setAuto(false);
    setActive(index);
    if (focus) tabs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step) {
      event.preventDefault();
      choose((active + step + count) % count, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      choose(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      choose(count - 1, true);
    }
  }

  return (
    <section
      className="lq-flow-section"
      aria-labelledby={`${id}-heading`}
      ref={section}
      data-playing={playing ? "true" : "false"}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovering(false);
      }}
    >
      <div className="lq-site-section-heading lq-flow-heading">
        <p className="mj-section-label">{copy.label}</p>
        <h2 id={`${id}-heading`}>{copy.title}</h2>
        <p>{copy.lede}</p>
      </div>

      <div className="lq-flow" role="tablist" aria-label={copy.flowLabel} onKeyDown={onKeyDown}>
        <span className="lq-flow-rail" aria-hidden="true">
          <span className="lq-flow-marker" style={{ left: `${((active + 0.5) / count) * 100}%` }} />
        </span>
        {items.slice(0, count).map((item, index) => (
          <button
            key={item.href}
            ref={(element) => { tabs.current[index] = element; }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            className="lq-flow-node"
            aria-selected={active === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => choose(index)}
          >
            <span className="lq-flow-step" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <ProductGlyph kind={item.title} />
            <span className="lq-flow-name">{item.title}</span>
            <span className="lq-flow-progress" aria-hidden="true" />
          </button>
        ))}
      </div>

      {copy.stages.slice(0, count).map((stage, index) => {
        const item = items[index]!;
        return (
          <div
            key={stage.figure}
            role="tabpanel"
            id={`${id}-panel-${index}`}
            aria-labelledby={`${id}-tab-${index}`}
            className="lq-flow-panel"
            hidden={active !== index}
            tabIndex={0}
          >
            <div className="lq-flow-copy">
              <p className="mj-section-label">{String(index + 1).padStart(2, "0")} · {item.title}</p>
              <h3>{stage.title}</h3>
              <p>{stage.body}</p>
              <a className="mj-text-link" href={item.href}>{stage.link} <span aria-hidden="true">→</span></a>
            </div>
            <div className="lq-flow-figure">
              <StageFigure figure={stage.figure} locale={locale} />
            </div>
          </div>
        );
      })}
    </section>
  );
}

/**
 * Small drawings of each surface. Decorative and hidden from assistive
 * technology: the stage's copy beside them carries the meaning. No number in
 * them is a measurement.
 */
function StageFigure({ figure, locale }: { figure: HowItWorksStage["figure"]; locale: PublicLocale }) {
  const ja = locale === "ja";
  if (figure === "studio") return <LandingCircuit locale={locale} />;
  if (figure === "nala") {
    return (
      <div className="lq-fig lq-fig-nala" aria-hidden="true">
        <p className="lq-fig-bubble lq-fig-bubble--you">{ja ? "ベル状態を作って検証して。" : "Build a Bell state and verify it."}</p>
        <div className="lq-fig-bubble lq-fig-bubble--nala">
          <svg viewBox="0 0 220 76" className="lq-fig-circuit">
            <g className="lq-circuit-wires"><path d="M40 22H210M40 54H210M124 22V54" /><rect x="66" y="8" width="28" height="28" rx="2" /><circle cx="124" cy="54" r="11" /><path d="M116 54H132M124 46V62" /><rect x="168" y="8" width="28" height="28" rx="2" /><rect x="168" y="40" width="28" height="28" rx="2" /></g>
            <circle className="lq-circuit-control" cx="124" cy="22" r="4" />
            <g className="lq-circuit-labels"><text x="4" y="27">q₀</text><text x="4" y="59">q₁</text><text x="80" y="27" textAnchor="middle">H</text><text x="182" y="27" textAnchor="middle">M</text><text x="182" y="59" textAnchor="middle">M</text></g>
          </svg>
          <p className="lq-fig-check"><span className="lq-fig-check-glyph">✓</span>{ja ? "検証済み · 測定分布が期待値と一致" : "Verified · the measured distribution matches"}</p>
        </div>
      </div>
    );
  }
  if (figure === "atlas") {
    return (
      <div className="lq-fig lq-fig-atlas" aria-hidden="true">
        <div className="lq-fig-card">
          <span className="lq-fig-kicker">◐ {ja ? "検証済み・文献 · アルゴリズム" : "Attested & literature · Algorithm"}</span>
          <strong>{ja ? "位相推定" : "Phase estimation"}</strong>
          <span className="lq-fig-text">{ja ? "ユニタリの固有位相を読み出す。ショアのアルゴリズムと化学のエネルギー計算の中核。" : "Read out the eigenphase of a unitary. The engine behind Shor's algorithm and chemistry energies."}</span>
          <span className="lq-fig-row"><span className="lq-fig-pill">{ja ? "Studioに追加" : "Add to Studio"}</span><span className="lq-fig-muted">{ja ? "出典 · Kitaev, 1995" : "Source · Kitaev, 1995"}</span></span>
        </div>
        <div className="lq-fig-card lq-fig-card--behind" />
      </div>
    );
  }
  if (figure === "notebooks") {
    return (
      <div className="lq-fig lq-fig-notebook" aria-hidden="true">
        <div className="lq-fig-cell lq-fig-cell--md"><strong>{ja ? "## なぜコイン2枚ではもつれにならないのか" : "## Why two coins are not entangled"}</strong></div>
        <div className="lq-fig-cell lq-fig-cell--code"><code>counts = sample(bell, shots=1024)</code></div>
        <div className="lq-fig-cell lq-fig-cell--out"><span className="lq-fig-check-glyph">✓</span>{ja ? "チェックポイント通過" : "Checkpoint passed"}</div>
      </div>
    );
  }
  return (
    <div className="lq-fig lq-fig-qapp" aria-hidden="true">
      <div className="lq-fig-controls">
        <span className="lq-fig-range"><span>{ja ? "位相 θ" : "Phase θ"}</span><i style={{ width: "62%" }} /></span>
        <span className="lq-fig-range"><span>{ja ? "ショット数" : "Shots"}</span><i style={{ width: "40%" }} /></span>
      </div>
      <div className="lq-fig-bars">
        {[["|00⟩", 88], ["|01⟩", 4], ["|10⟩", 5], ["|11⟩", 86]].map(([label, height]) => (
          <span key={label as string} className="lq-fig-bar"><i style={{ height: `${height}%` }} /><span>{label}</span></span>
        ))}
      </div>
      <span className="lq-fig-pill">{ja ? "リンクを共有" : "Share link"}</span>
    </div>
  );
}
