export const THEME_STORAGE_KEY = "majorana.theme.v1";

export type Theme = "light" | "dark";

export const DARK_PUBLIC_PATHS = ["/", "/workspace", "/repository", "/about", "/pricing", "/contact", "/privacy", "/terms"];

export function isDarkPublicPath(pathname: string): boolean {
  const path = pathname.replace(/^\/(en|ja)(?=\/|$)/, "").replace(/\/$/, "") || "/";
  return DARK_PUBLIC_PATHS.includes(path) || path.startsWith("/repository/");
}

const THEME_CHANGE_EVENT = "leona:theme-change";
let sessionTheme: Theme | null = null;
let transitionFrame = 0;

export function preferredTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // The in-memory choice still survives locale navigation without storage.
  }
  return sessionTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

export function applyTheme(theme: Theme, persist = false) {
  const root = document.documentElement;
  if (root.dataset.theme !== theme) {
    // Apply the whole palette together. Interpolated backgrounds paired with
    // the new text color can be unreadable during an otherwise brief transition.
    if (transitionFrame) window.cancelAnimationFrame(transitionFrame);
    root.classList.add("lq-theme-switching");
    root.dataset.theme = theme;
    transitionFrame = window.requestAnimationFrame(() => {
      transitionFrame = window.requestAnimationFrame(() => {
        root.classList.remove("lq-theme-switching");
        transitionFrame = 0;
      });
    });
  }
  if (persist) {
    sessionTheme = theme;
    try { window.localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export function readDocumentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
