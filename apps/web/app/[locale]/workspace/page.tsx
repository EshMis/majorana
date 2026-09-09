import type { Metadata } from "next";
import { PublicSite } from "../../../components/public-site";
import Link from "next/link";
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
  return (
    <PublicSite activePath="/workspace" className="mj-open-source lq-site-workspace" locale={locale} chrome="static">
      <section className="mj-public-page-hero">
        <p className="mj-section-label">{copy.overline}</p>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <div className="mj-public-actions">
          <Link className="mj-primary-button" href="/run">{copy.primary}</Link>
          <Link className="mj-secondary-button" href="/repository">{copy.secondary}</Link>
        </div>
      </section>
      <section className="lq-site-products" aria-labelledby="workspace-surfaces-heading">
        <div className="lq-site-section-heading"><h2 id="workspace-surfaces-heading">{HOME_COPY[locale].product.title}</h2></div>
        <div className="lq-site-product-grid">
          {HOME_COPY[locale].product.items.map((item) => (
            <Link className="lq-site-product" href={item.href} key={item.title}>
              <div><h3>{item.title}</h3><p>{item.body}</p></div><span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="lq-site-evidence" aria-labelledby="workspace-flow-heading">
        <div className="lq-site-section-heading"><p className="mj-section-label">{copy.loopLabel}</p><h2 id="workspace-flow-heading">{copy.loopTitle}</h2></div>
        <div className="lq-site-principles">
          {copy.loop.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}
        </div>
      </section>
    </PublicSite>
  );
}
