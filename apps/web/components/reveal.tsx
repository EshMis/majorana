"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A single, gentle entrance; content never depends on JavaScript to be visible. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || media.matches || !element.animate || !window.IntersectionObserver) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      if (media.matches) return;
      animation = element.animate(
        [{ transform: "translateY(8px)" }, { transform: "none" }],
        // fill: "backwards" holds the first keyframe through the delay; without it a
        // delayed element sat at rest and then dropped 8px before settling.
        { duration: 360, delay: Math.min(delay, 180), easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" },
      );
    }, { threshold: .08 });
    const stop = () => { if (media.matches) animation?.cancel(); };
    observer.observe(element);
    media.addEventListener("change", stop);
    return () => { observer.disconnect(); animation?.cancel(); media.removeEventListener("change", stop); };
  }, [delay]);
  return (
    <div ref={ref} className={`mj-reveal ${className}`.trim()}>
      {children}
    </div>
  );
}
