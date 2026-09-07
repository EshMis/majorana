"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicLocale } from "../lib/public-locale";
import { MenuIcon } from "./icons";

type NavigationItem = { href: string; label: string };

export function PublicNavigation({ items, activePath, locale, children }: {
  items: NavigationItem[];
  activePath?: string;
  locale: PublicLocale;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lq-public-navigation" ref={root}>
      <button className="lq-public-menu-trigger" ref={trigger} type="button" aria-expanded={open} aria-controls={`lq-public-menu-${locale}`} onClick={() => setOpen(!open)}>
        <MenuIcon size={20} />
        <span className="sr-only">{locale === "ja" ? "メニュー" : "Menu"}</span>
      </button>
      <div id={`lq-public-menu-${locale}`} className={`lq-public-menu-panel${open ? " is-open" : ""}`}>
        <nav className="mj-public-nav" aria-label={locale === "ja" ? "公開ナビゲーション" : "Public navigation"}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} aria-current={activePath === item.href ? "page" : undefined} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="lq-public-preferences">{children}</div>
      </div>
    </div>
  );
}
