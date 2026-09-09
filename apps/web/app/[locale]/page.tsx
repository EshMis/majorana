import Link from "next/link";
import { LandingCircuit } from "../../components/landing-circuit";
import { LiquidGridBackground } from "../../components/liquid-grid-background";
import { ProductGlyph } from "../../components/product-glyph";
import { Reveal } from "../../components/reveal";
import type { Metadata } from "next";
import { LandingDemoVideo } from "../../components/landing-demo-video";
import { LandingBenchmark } from "../../components/landing-benchmark";
import { LandingPrompt } from "../../components/landing-prompt";
import { PublicSite } from "../../components/public-site";
import { HOME_COPY } from "../../lib/public-copy";
import { parsePublicLocale, PUBLIC_LOCALES } from "../../lib/public-locale";
import { canonicalMetadata } from "../../lib/public-metadata";
import { homeMetadataCopy } from "../../lib/public-page-metadata";

// Served from the CDN. The locale comes from the path segment because a cached
// page cannot read a cookie — `middleware.ts` rewrites the clean URL to this
// one, keeping `/{clean}` in the address bar while giving each language its own
// cache entry. `dynamicParams = false` is what stops `[locale]` from swallowing
// every mistyped URL and answering it with this page instead of a 404.
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }));
}

// No `title` on English, on purpose. The root layout declares
// `template: "%s · Leona Quantum"`, so a segment title of "Leona Quantum" was
// composed into **"Leona Quantum · Leona Quantum"** — which is what a reader saw
// in the browser tab, what a bookmark saved, and what a search result showed.
//
// Omitting it falls through to the root layout's `default`, which is the one
// title in this app deliberately written to stand alone. Every other
// `[locale]` page names a SECTION ("Pricing", "Contact"), which is exactly what
// the template is for; the home page is the one page whose subject is the
// template's own suffix, which is why it is the one page that must not use it.
//
// Japanese cannot lean on that fallback: the root metadata's `default` is a
// fixed English string — metadata is shared by every root layout and so cannot
// be per-locale, even now that `<html lang>` is (ai-ops issue 151) — so a
// Japanese reader fell through
// to it too and got an English tab title on an otherwise fully localized page.
// `homeMetadataCopy` states an explicit Japanese title for that branch only —
// see its own comment for why the ternary lives in `lib/public-page-metadata.ts`
// rather than inline here.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = parsePublicLocale((await params).locale);
  return {
    ...homeMetadataCopy(locale),
    // The clean path, and the same one for both locales. `/en` and `/ja` are the
    // routes that render this page, not addresses anybody should link to — the
    // middleware 308s them back — and the language is a cookie preference rather
    // than a second version of the site. So the two locales are one canonical
    // URL, not a pair of alternates.
    ...canonicalMetadata("/"),
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parsePublicLocale((await params).locale);
  const copy = HOME_COPY[locale];
  return (
    <PublicSite activePath="/" className="mj-company-site lq-site-home" locale={locale} chrome="static">
      <section className="lq-site-hero" aria-labelledby="home-heading">
        <LiquidGridBackground />
        <div className="lq-hero-orbits" aria-hidden="true"><i /><i /><i /></div>
        <div className="lq-site-hero-copy">
          <p className="mj-section-label">{copy.hero.label}</p>
          <h1 id="home-heading">{copy.hero.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
          <p>{copy.hero.lede}</p>
          <LandingPrompt copy={copy.promptDemo} />
          <div className="mj-public-actions">
            <a className="mj-primary-button" href="/run">{copy.hero.primary}</a>
            <Link className="mj-text-link" href="/repository">{copy.hero.secondary} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="lq-home-example" aria-labelledby="home-example-heading">
          <div className="lq-home-example-copy">
            <p className="mj-section-label">{locale === "ja" ? "アイデアから実装へ" : "From idea to implementation"}</p>
            <h2 id="home-example-heading">{locale === "ja" ? "回路を見て、コードを理解する。" : "See the circuit. Understand the code."}</h2>
            <p>{locale === "ja" ? "Nalaに問いを伝え、Studioで回路を編集。コードと結果を保存し、次の実験につなげます。" : "Start with a question in Nala. Refine the circuit in Studio, then keep the code and results for your next experiment."}</p>
            <a className="mj-text-link" href="/studio">{locale === "ja" ? "Studioを開く" : "Explore Studio"} <span aria-hidden="true">→</span></a>
          </div>
          <LandingCircuit locale={locale} />
        </section>
      </Reveal>

      <section className="lq-site-products" aria-labelledby="surfaces-heading">
        <div className="lq-site-section-heading">
          <p className="mj-section-label">{copy.product.label}</p>
          <h2 id="surfaces-heading">{copy.product.title}</h2>
        </div>
        <div className="lq-site-product-grid">
          {copy.product.items.map((item) => (
            <a className="lq-site-product" href={item.href} key={item.title}>
              <ProductGlyph kind={item.title} />
              <div><h3>{item.title}</h3><p>{item.body}</p></div>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="lq-site-demo" aria-labelledby="demo-heading">
        <div>
          <p className="mj-section-label">{copy.visual.label}</p>
          <h2 id="demo-heading">{copy.visual.demoLabel}</h2>
          <p id="lq-landing-demo-description">{copy.visual.demoDescription}</p>
        </div>
        <LandingDemoVideo
          describedById="lq-landing-demo-description"
          fallback={copy.visual.demoFallback}
          label={copy.visual.demoLabel}
          poster="/media/leona-product-demo-poster.jpg"
          src="/media/leona-product-demo.mp4"
        />
      </section>

      <section className="lq-site-evidence" aria-labelledby="evidence-heading">
        <div className="lq-site-section-heading">
          <p className="mj-section-label">{copy.principles.label}</p>
          <h2 id="evidence-heading">{copy.principles.title}</h2>
        </div>
        <div className="lq-site-principles">
          {copy.principles.items.map((item) => (
            <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>
          ))}
        </div>
        <p className="lq-site-frameworks">{copy.frameworks.label} <span>{copy.frameworks.items.join(" · ")}</span></p>
      </section>

      <LandingBenchmark copy={copy.benchmark} />

      <section className="mj-company-final-cta" aria-labelledby="company-cta-heading">
        <div className="mj-company-final-cta-copy">
          <h2 id="company-cta-heading">{copy.cta.title}</h2>
          <p>{copy.cta.body}</p>
        </div>
        <div className="mj-public-actions">
          <a className="mj-primary-button" href="/run">{copy.cta.primary}</a>
          <Link className="mj-secondary-button" href="/repository">{copy.cta.secondary}</Link>
        </div>
      </section>
    </PublicSite>
  );
}
