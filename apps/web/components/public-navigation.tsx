import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicLocale } from "../lib/public-locale";

type NavigationItem = { href: string; label: string };

export function PublicNavigation({ items, activePath, locale, children }: {
  items: NavigationItem[];
  activePath?: string;
  locale: PublicLocale;
  children: ReactNode;
}) {
  return (
    <div className="lq-public-navigation">
      <div className="lq-public-menu-panel">
        <nav className="mj-public-nav" aria-label={locale === "ja" ? "公開ナビゲーション" : "Public navigation"}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} aria-current={activePath === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="lq-public-preferences">{children}</div>
      </div>
    </div>
  );
}
