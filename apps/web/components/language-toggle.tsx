"use client";

import { PUBLIC_LOCALE_COOKIE, type PublicLocale } from "../lib/public-locale";

export function LanguageToggle({ locale, label = "Language" }: { locale: PublicLocale; label?: string }) {
  function selectLocale(nextLocale: PublicLocale) {
    if (nextLocale === locale) return;
    document.cookie = `${PUBLIC_LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    // Middleware can select a different [locale] root document. A full load
    // runs its beforeInteractive scripts instead of inserting inert scripts
    // during a client-side root replacement via router.refresh().
    window.location.reload();
  }

  return (
    <div className="mj-language-toggle" role="group" aria-label={label}>
      {(["en", "ja"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          title={option === "en" ? "Use English" : "日本語を使用"}
          onClick={() => selectLocale(option)}
        >
          {option === "en" ? "EN" : "日本語"}
        </button>
      ))}
    </div>
  );
}
