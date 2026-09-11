import type { Metadata } from "next";
import { PublicSite } from "../../../components/public-site";
import Link from "next/link";
import { ProductGlyph } from "../../../components/product-glyph";
import { Reveal } from "../../../components/reveal";
import { HOME_COPY, WORKSPACE_LANDING_COPY } from "../../../lib/public-copy";
import { parsePublicLocale, PUBLIC_LOCALES } from "../../../lib/public-locale";
import { canonicalMetadata } from "../../../lib/public-metadata";
import { workspaceMetadataCopy } from "../../../lib/public-page-metadata";

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

// Localized — see `lib/public-page-metadata.ts` for the locale branch and why
// it lives there rather than inline. A static English export here left a
// Japanese reader's tab, search result and shared link in English while the
// page body (below) already renders `WORKSPACE_LANDING_COPY[locale]`.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = parsePublicLocale((await params).locale);
  return { ...workspaceMetadataCopy(locale), ...canonicalMetadata("/workspace") };
}

export default async function WorkspacePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parsePublicLocale((await params).locale);
  const copy = WORKSPACE_LANDING_COPY[locale];
  const tools = HOME_COPY[locale].product.items;
  return (
    <PublicSite activePath="/workspace" className="mj-open-source lq-site-workspace" locale={locale} chrome="static">
      <section className="lq-workspace-intro" aria-labelledby="workspace-heading">
        <div>
          <p className="mj-section-label">{copy.overline}</p>
          <h1 id="workspace-heading">{copy.title}</h1>
          <p>{copy.body}</p>
          <a className="mj-primary-button" href="/run">{copy.primary}</a>
        </div>
        <div className="lq-workspace-map" aria-label={HOME_COPY[locale].product.title}>
          {tools.map((item, index) => (
            <a className={`lq-workspace-node lq-workspace-node--${index}`} href={item.href} key={item.href}>
              <ProductGlyph kind={item.title} /><span>{item.title}</span>
              <span className="lq-node-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
          <svg className="lq-workspace-connections" viewBox="0 0 600 430" preserveAspectRatio="none" aria-hidden="true"><path d="M150 80H450V215H150V350H450M150 80V350M450 215V350" /></svg>
        </div>
      </section>
      <section className="lq-workspace-tool-list" aria-label={HOME_COPY[locale].product.title}>
        {tools.map((item, index) => <Reveal key={item.href} delay={index * 35}><a href={item.href}><span className="mj-section-label">{String(index + 1).padStart(2, "0")}</span><h2>{item.title}</h2><p>{item.body}</p><span aria-hidden="true">↗</span></a></Reveal>)}
      </section>
      <section className="lq-workspace-loop" aria-labelledby="workspace-flow-heading">
        <div className="lq-site-section-heading"><p className="mj-section-label">{copy.loopLabel}</p><h2 id="workspace-flow-heading">{copy.loopTitle}</h2></div>
        <ol>
          {copy.loop.map((item, index) => <li key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></li>)}
        </ol>
        <Link className="mj-text-link" href="/repository">{copy.secondary} <span aria-hidden="true">→</span></Link>
      </section>
    </PublicSite>
  );
}
