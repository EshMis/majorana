"use client";

import Link from "next/link";
import type { PublicLocale } from "../../../lib/public-locale";
import { ACCOUNT_COPY } from "../../../lib/workspace-locale";

/** Billing entry points describe the actions available in this deployment. */
export function BillingPanel({ locale }: { locale: PublicLocale }) {
  const copy = ACCOUNT_COPY[locale];
  const ja = locale === "ja";
  return (
    <section className="mj-artifact-panel leona-billing-panel" id="billing" aria-labelledby="billing-heading">
      <div className="mj-panel-heading"><h2 id="billing-heading">{copy.billingTitle}</h2></div>
      <p className="mj-panel-help">{ja ? "プランの変更や請求については、お問い合わせください。" : "Contact us for plan changes and billing questions."}</p>
      <div className="leona-workspace-actions">
        <Link className="mj-primary-button" href="/contact">{ja ? "お問い合わせ" : "Contact us"}</Link>
        <Link className="mj-secondary-button" href="/upgrade">{copy.billingUpgradeLink}</Link>
      </div>
      <details className="leona-workspace-disclosure">
        <summary>{copy.billingPolicyTitle}</summary>
        <p className="mj-panel-help">{copy.billingPolicyHelp}</p>
        <dl className="mj-usage-list">
          <div><dt>{copy.billingPolicyFree}</dt><dd>{copy.billingPolicyFreeValue}</dd></div>
          <div><dt>{copy.billingPolicyDemo}</dt><dd>{copy.billingPolicyDemoValue}</dd></div>
          <div><dt>{copy.billingPolicyCpu}</dt><dd>{copy.billingPolicyCpuValue}</dd></div>
          <div><dt>{copy.billingPolicyHardware}</dt><dd>{copy.billingPolicyHardwareValue}</dd></div>
        </dl>
        <p>{ja ? "利用量と上限は「利用状況」で確認できます。量子ハードウェアへの送信前に、Studioで費用の見積もりを確認してください。" : "View your current usage and allowances in Usage. Review hardware cost estimates in Studio before submitting a job."}</p>
        <div className="leona-workspace-actions">
          <Link href="/account#usage">{copy.usageTitle}</Link>
          <Link href="/studio">{copy.billingEstimatesLink}</Link>
        </div>
      </details>
    </section>
  );
}
