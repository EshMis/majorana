"use client";

import type { ReactNode } from "react";

/** Content stays visible across scrolling and navigation. */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={`mj-reveal ${className}`.trim()}>
      {children}
    </div>
  );
}
