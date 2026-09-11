import type { Metadata } from "next";
import Link from "next/link";
import { PublicSite } from "../../../../components/public-site";
import { getPublicLocale } from "../../../../lib/public-locale-server";
import { safeReturnTo } from "../../../../lib/return-to";
import { majoranaSignInPath, type SignInFailureReason } from "../../../../lib/sign-in";

export const metadata: Metadata = {
  title: "Sign-in unavailable",
  description: "Retry signing in to Leona Quantum.",
};

/**
 * Reachable without a session, and that is the whole point.
 *
 * `lib/public-paths.ts` publishes `/auth/sign-in` and its subtree to BOTH
 * matchers — our own `isPublicPath()` and AuthKit's glob list. Until that was
 * true, this page was gated: a visitor whose sign-in had just failed because
 * the provider did not answer would have been redirected to that same provider
 * to sign in before being allowed to read why signing in had failed.
 */
const COPY = {
  en: {
    title: "Sign-in did not start.",
    unavailable: "We could not connect to sign-in. Please try again.",
    notConfigured: "Sign-in is temporarily unavailable. Please contact us if you need help.",
    retry: "Try again",
    contact: "Contact Leona Quantum",
    reference: "Support reference",
  },
  ja: {
    title: "サインインを開始できませんでした。",
    unavailable: "サインインに接続できませんでした。もう一度お試しください。",
    notConfigured: "現在サインインを利用できません。サポートが必要な場合はお問い合わせください。",
    retry: "もう一度試す",
    contact: "Leona Quantumに問い合わせる",
    reference: "サポート参照ID",
  },
} as const;

export default async function SignInErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, query] = await Promise.all([getPublicLocale(), searchParams]);
  const copy = COPY[locale];
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  // A closed set, not whatever the query string says: the reason picks which
  // sentence a visitor reads, so an unrecognised value must fall to the generic
  // one rather than reach the page.
  const reason: SignInFailureReason =
    first(query.reason) === "not_configured" ? "not_configured" : "provider_unavailable";
  const returnTo = safeReturnTo(first(query.returnTo));
  const requestId = first(query.requestId)?.slice(0, 64);

  return (
    <PublicSite className="mj-legal-site" locale={locale} chrome="static">
      <section className="mj-legal-hero">
        <h1>{copy.title}</h1>
        <p>{reason === "not_configured" ? copy.notConfigured : copy.unavailable}</p>
        {requestId ? <span>{copy.reference}: {requestId}</span> : null}
        <div className="mj-public-actions">
          <a className="mj-primary-button" href={majoranaSignInPath(returnTo)}>{copy.retry}</a>
          <Link className="mj-secondary-button" href="/contact">{copy.contact}</Link>
        </div>
      </section>
    </PublicSite>
  );
}
