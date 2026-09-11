import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ThemeController } from "../../components/theme-controller";
import { ThemeToggle } from "../../components/theme-toggle";
import { THEME_STORAGE_KEY } from "../../lib/theme";

beforeEach(() => { window.history.replaceState(null, "", "/run"); });

afterEach(() => { cleanup(); window.localStorage.clear(); delete document.documentElement.dataset.theme; });

function installMedia() {
  const media = { matches: true, addEventListener() {}, removeEventListener() {} };
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => media });
}

test("locale root replacement restores the chosen theme and keeps both controls in sync", () => {
  installMedia();
  window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  const ui = (locale: "en" | "ja") => <><ThemeController locale={locale} /><ThemeToggle locale={locale} /><ThemeToggle locale={locale} /></>;
  const view = render(ui("en"));
  assert.equal(document.documentElement.dataset.theme, "light", "explicit light overrides dark OS preference");
  fireEvent.click(view.getAllByRole("button", { name: "Use dark theme" })[0]!);
  assert.ok(view.getAllByRole("button", { name: "Use dark theme" }).every(button => button.getAttribute("aria-pressed") === "true"));
  assert.equal(window.localStorage.getItem(THEME_STORAGE_KEY), "dark");
  // Next replaces HTML singleton attributes when the localized root changes.
  delete document.documentElement.dataset.theme;
  view.rerender(ui("ja"));
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.ok(view.getAllByRole("button", { name: "ダークテーマを使用" }).every(button => button.getAttribute("aria-pressed") === "true"));
  fireEvent.click(view.getAllByRole("button", { name: "ライトテーマを使用" })[1]!);
  delete document.documentElement.dataset.theme;
  view.rerender(ui("en"));
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.ok(view.getAllByRole("button", { name: "Use light theme" }).every(button => button.getAttribute("aria-pressed") === "true"));
});

test("a theme change from another tab updates the page and controls", () => {
  installMedia();
  window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  const view = render(<><ThemeController locale="en" /><ThemeToggle /></>);
  act(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    window.dispatchEvent(new window.StorageEvent("storage", { key: THEME_STORAGE_KEY, newValue: "dark" }));
  });
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(view.getByRole("button", { name: "Use dark theme" }).getAttribute("aria-pressed"), "true");
});


test("public navigation stays dark without overwriting the workspace preference", () => {
  installMedia();
  window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  const view = render(<ThemeController locale="en" />);
  assert.equal(document.documentElement.dataset.theme, "light");
  for (const path of ["/", "/workspace", "/repository", "/repository/layers", "/about", "/pricing", "/contact", "/ja/about"]) {
    window.history.replaceState(null, "", path);
    view.rerender(<ThemeController locale="en" />);
    assert.equal(document.documentElement.dataset.theme, "dark", path);
    assert.equal(window.localStorage.getItem(THEME_STORAGE_KEY), "light");
  }
  for (const path of ["/run", "/events/qiskit-fall-fest-2026"]) {
    window.history.replaceState(null, "", path);
    view.rerender(<ThemeController locale="en" />);
    assert.equal(document.documentElement.dataset.theme, "light", path);
  }
});
