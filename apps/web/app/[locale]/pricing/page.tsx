import type { Metadata } from "next";
import { PublicSite } from "../../../components/public-site";
import { Reveal } from "../../../components/reveal";
import { PRICING_COPY } from "../../../lib/public-copy";
import { isPublicDemoEnabled } from "../../../lib/public-demo";
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
  const demoEnabled = isPublicDemoEnabled();
  return (
    <PublicSite activePath="/pricing" className="mj-pricing-site" locale={locale} chrome="static">
      <Reveal>
        <section className="lq-pricing-intro">
          <h1>{locale === "ja" ? <>料金とプランを、<br />検討しています。</> : <>Pricing, still<br />in the making.</>}</h1>
          <div className="lq-pricing-intro-copy">
            <p>{copy.hero.body}</p>
            <a className="lq-pricing-text-link" href="/contact">
              {locale === "ja" ? "利用について相談する" : "Discuss your needs"}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="lq-pricing-proposals" aria-labelledby="pricing-proposals-title">
          <div className="lq-pricing-section-heading">
            <h2 id="pricing-proposals-title">{locale === "ja" ? "検討中のプラン" : "Plans under consideration"}</h2>
            <p>{locale === "ja" ? "料金・機能構成は未確定です" : "Pricing and features are not final"}</p>
          </div>
          <div className="lq-pricing-columns">
            {copy.plans.map((plan) => (
              <article className="lq-pricing-plan" key={plan.name}>
                <h3>{plan.name}</h3>
                <ul>
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="lq-pricing-contact">
          <div>
            <h2>{locale === "ja" ? "まずは、研究の話から。" : "Start with your research."}</h2>
            <p>{locale === "ja" ? "用途やチームの規模など、ご要望をお聞かせください。" : "Tell us about your use case, your team, and what you need."}</p>
          </div>
          <div className="lq-pricing-contact-actions">
            <a className="mj-primary-button" href="/contact">{locale === "ja" ? "お問い合わせ" : "Get in touch"}</a>
            {demoEnabled ? <a className="lq-pricing-text-link" href="/demo">{locale === "ja" ? "プレビューを試す" : "Try the preview"}</a> : null}
          </div>
        </section>
      </Reveal>
    </PublicSite>
  );
}
