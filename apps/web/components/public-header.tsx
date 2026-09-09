"use client";

import type { ReactNode } from "react";

export function PublicHeader({ children }: { children: ReactNode }) {
  return (
    <header className="mj-public-header lq-public-header" onFocusCapture={(event) => {
      // Native focus scrolling can leave a partly visible link clipped.
      const frame = event.currentTarget.getBoundingClientRect();
      const target = event.target.getBoundingClientRect();
      if (target.right > frame.right - 12) event.currentTarget.scrollLeft += target.right - frame.right + 12;
      else if (target.left < frame.left + 12) event.currentTarget.scrollLeft -= frame.left - target.left + 12;
    }}>
      {children}
    </header>
  );
}
