import type { Metadata } from "next";
import { PublicSite } from "../../../components/public-site";
import { ProductGlyph } from "../../../components/product-glyph";
import { CONTACT_COPY } from "../../../lib/public-copy";
import { ContactForm } from "./contact-form";
import { parsePublicLocale, PUBLIC_LOCALES } from "../../../lib/public-locale";
import { canonicalMetadata } from "../../../lib/public-metadata";
import { contactMetadataCopy } from "../../../lib/public-page-metadata";

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

// Localized — a static English export here left a Japanese reader's browser
// tab, search result and shared link in English while the page body (below)
// already renders `CONTACT_COPY[locale]`. See `lib/public-page-metadata.ts`
// for the locale branch and why it lives there rather than inline.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = parsePublicLocale((await params).locale);
  return { ...contactMetadataCopy(locale), ...canonicalMetadata("/contact") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = parsePublicLocale((await params).locale);
  const copy = CONTACT_COPY[locale];
  return (
    <PublicSite activePath="/contact" className="mj-contact-site" locale={locale} chrome="static">
      <section className="lq-contact-split" aria-labelledby="contact-heading">
        <div className="lq-contact-intro">
          <p className="mj-section-label">{copy.overline}</p>
          <h1 id="contact-heading">{copy.title}</h1>
          <p>{copy.body}</p>
          <ProductGlyph kind="Nala" />
          <section className="lq-contact-help" aria-labelledby="contact-help-heading">
            <h2 id="contact-help-heading">{copy.panelTitle}</h2>
            <ul>{copy.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </section>
        </div>
        <div className="mj-contact-form-section mj-contact-form-section--solo">
          <ContactForm locale={locale} />
        </div>
      </section>
    </PublicSite>
  );
}
