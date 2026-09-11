"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, subscribeTheme, readDocumentTheme, type Theme } from "../lib/theme";
import type { PublicLocale } from "../lib/public-locale";

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === "light" ? (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M12.95 3.05l-1.4 1.4M4.45 11.55l-1.4 1.4" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M13.6 10.1A5.6 5.6 0 0 1 5.9 2.4 5.8 5.8 0 1 0 13.6 10Z" />
    </svg>
  );
}

export function ThemeToggle({ locale = "en" }: { locale?: PublicLocale }) {
  const theme = useSyncExternalStore(subscribeTheme, readDocumentTheme, () => null);

  function selectTheme(nextTheme: Theme) {
    applyTheme(nextTheme, true);
  }

  const copy = locale === "ja"
    ? { group: "カラーテーマ", light: "ライト", dark: "ダーク", lightTitle: "ライトテーマを使用", darkTitle: "ダークテーマを使用" }
    : { group: "Color theme", light: "Light", dark: "Dark", lightTitle: "Use light theme", darkTitle: "Use dark theme" };

  return (
    <div className="mj-theme-toggle" role="group" aria-label={copy.group} title={copy.group}>
      {(["light", "dark"] as const).map((option) => (
        <button
          key={option}
          type="button"
          data-theme-option={option}
          aria-label={option === "light" ? copy.lightTitle : copy.darkTitle}
          title={option === "light" ? copy.lightTitle : copy.darkTitle}
          aria-pressed={theme === null ? undefined : theme === option}
          onClick={() => selectTheme(option)}
        >
          <ThemeIcon theme={option} />
          <span>{option === "light" ? copy.light : copy.dark}</span>
        </button>
      ))}
    </div>
  );
}
