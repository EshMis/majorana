"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { applyTheme, isDarkPublicPath, preferredTheme, THEME_STORAGE_KEY } from "../lib/theme";

/** Locale navigation replaces the root HTML attributes without rerunning Next Script. */
export function ThemeController({ locale }: { locale: string }) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const sync = () => applyTheme(isDarkPublicPath(pathname) ? "dark" : preferredTheme());
    sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) sync();
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", sync);
    media.addEventListener("change", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", sync);
      media.removeEventListener("change", sync);
    };
  }, [locale, pathname]);
  return null;
}
