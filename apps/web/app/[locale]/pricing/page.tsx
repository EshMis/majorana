import type { Metadata } from "next";
import { PublicSite } from "../../../components/public-site";
import { PRICING_COPY } from "../../../lib/public-copy";
import { parsePublicLocale, PUBLIC_LOCALES } from "../../../lib/public-locale";
import { canonicalMetadata } from "../../../lib/public-metadata";
import { pricingMetadataCopy } from "../../../lib/public-page-metadata";

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
// page body (below) already renders `PRICING_COPY[locale]`.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = parsePublicLocale((await params).locale);
  return { ...pricingMetadataCopy(locale), ...canonicalMetadata("/pricing") };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parsePublicLocale((await params).locale);
  const copy = PRICING_COPY[locale];
  return (
    <PublicSite activePath="/pricing" className="mj-pricing-site" locale={locale} chrome="static">
      <section className="mj-public-page-hero"><h1>{copy.hero.title}</h1><p>{copy.hero.body}</p></section>
      <section className="mj-pricing-grid" aria-label={locale === "ja" ? "Leona Quantumのプラン" : "Leona Quantum plans"}>
        {copy.plans.map((plan) => (
          <article className={`mj-pricing-card mj-pricing-card--${plan.tone}`} key={plan.name}>
            <div className="mj-pricing-card-head">
              <h2>{plan.name}</h2>
            </div>
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <a className={plan.tone === "featured" ? "mj-primary-button" : "mj-secondary-button"} href={plan.name === "Free" ? "/run" : `/contact?plan=${encodeURIComponent(plan.name)}`}>{plan.action}</a>
          </article>
        ))}
      </section>
    </PublicSite>
  );
}
