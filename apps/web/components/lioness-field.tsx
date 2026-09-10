"use client";

import { useEffect, useRef } from "react";
import { LIONESS_EYE_SHARD, LIONESS_SHARDS, LIONESS_SHARD_ASPECT } from "./lioness-shards";

/**
 * The lioness, assembled from pieces.
 *
 * Every shard of the silhouette (`lioness-shards.ts`, a triangle mosaic of the
 * owner's reference art) starts scattered around the figure, turned and shrunk,
 * and settles into place along an eased path — tail first, head last, so the
 * animal walks in over about two seconds. Once assembled the figure holds
 * still; a soft light passes across the mosaic every few seconds, and the eye
 * stays a shade brighter than the rest. While the composer is engaged the whole
 * figure brightens.
 *
 * Colours are read from the theme at draw time (`--accent`, `--bg-0`,
 * `--text-0`), so it follows light and dark without a prop. Drawing stops
 * while the canvas is off screen or the tab is hidden, and under reduced
 * motion the assembled figure is painted once with no sweep.
 */
export function LionessField({ engaged = false, className = "" }: { engaged?: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engagedRef = useRef(engaged);
  engagedRef.current = engaged;

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduceMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A seeded generator so every visit scatters the same way and the entrance
    // reads as the figure's own, not as noise.
    let seed = 0x9e3779b9;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const parts = LIONESS_SHARDS.map((tri, index) => {
      const cx = (tri[0] + tri[2] + tri[4]) / 3;
      const cy = (tri[1] + tri[3] + tri[5]) / 3;
      const angle = random() * Math.PI * 2;
      const distance = 0.28 + random() * 0.55;
      return {
        tri,
        cx,
        cy,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance * 0.7,
        turn: (random() - 0.5) * Math.PI * 1.6,
        // Tail (x≈0) settles first, head (x≈1) last, with a little jitter.
        delay: cx * 0.62 + random() * 0.18,
        tone: 0.62 + random() * 0.38,
        eye: index === LIONESS_EYE_SHARD,
      };
    });

    const ASSEMBLE_MS = 2100;
    const SWEEP_MS = 6500;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    let raf = 0;
    let started = 0;
    let visible = document.visibilityState !== "hidden";
    let onScreen = true;
    let width = 0;
    let height = 0;

    function colors() {
      const style = getComputedStyle(canvas!);
      return {
        accent: style.getPropertyValue("--accent").trim() || "olivedrab",
        ground: style.getPropertyValue("--bg-0").trim() || "white",
        ink: style.getPropertyValue("--text-0").trim() || "black",
      };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (!started) started = now;
      const elapsed = now - started;
      const progress = reduceMotion ? 1 : Math.min(1, elapsed / ASSEMBLE_MS);
      const { accent, ground, ink } = colors();
      // Letterbox the figure into the box at its own aspect.
      const pad = 0.96;
      let boxW = width * pad;
      let boxH = boxW / LIONESS_SHARD_ASPECT;
      if (boxH > height * pad) {
        boxH = height * pad;
        boxW = boxH * LIONESS_SHARD_ASPECT;
      }
      const originX = (width - boxW) / 2;
      const originY = (height - boxH) / 2;
      const sweep = reduceMotion || progress < 1 ? -1 : ((elapsed - ASSEMBLE_MS) % SWEEP_MS) / SWEEP_MS;
      const sweepX = sweep < 0 ? -1 : -0.25 + sweep * 1.5;
      const lift = engagedRef.current ? 1 : 0.86;

      ctx!.clearRect(0, 0, width, height);
      ctx!.lineJoin = "round";
      for (const part of parts) {
        const local = Math.min(1, Math.max(0, (progress - part.delay * 0.55) / 0.45));
        const e = easeOut(local);
        if (e <= 0) continue;
        const scale = 0.45 + 0.55 * e;
        const turn = part.turn * (1 - e);
        const offX = part.dx * (1 - e);
        const offY = part.dy * (1 - e);
        const cos = Math.cos(turn);
        const sin = Math.sin(turn);
        ctx!.beginPath();
        for (let v = 0; v < 3; v += 1) {
          const rx = (part.tri[v * 2]! - part.cx) * scale;
          const ry = (part.tri[v * 2 + 1]! - part.cy) * scale;
          const x = part.cx + offX + rx * cos - ry * sin;
          const y = part.cy + offY + rx * sin + ry * cos;
          const px = originX + x * boxW;
          const py = originY + y * boxH;
          if (v === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        ctx!.closePath();
        const glow = sweepX < 0 ? 0 : 0.3 * Math.exp(-Math.pow((part.cx - sweepX) / 0.09, 2));
        const alpha = Math.min(1, (0.2 + 0.8 * e) * part.tone * lift + glow);
        ctx!.globalAlpha = part.eye ? Math.min(1, alpha + 0.35) : alpha;
        ctx!.fillStyle = part.eye ? ink : accent;
        ctx!.fill();
        // A hairline in the ground colour keeps the pieces apart so the mosaic
        // reads as pieces rather than one flat shape.
        ctx!.globalAlpha = 0.9;
        ctx!.strokeStyle = ground;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
      canvas!.dataset.drawing = String(!reduceMotion && visible && onScreen);
      if (!reduceMotion && visible && onScreen) raf = window.requestAnimationFrame(draw);
    }

    function start() {
      window.cancelAnimationFrame(raf);
      if (reduceMotion) {
        draw(performance.now());
        return;
      }
      if (visible && onScreen) raf = window.requestAnimationFrame(draw);
      else canvas!.dataset.drawing = "false";
    }

    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(performance.now());
    });
    resizeObserver.observe(parent);
    const onVisibility = () => {
      visible = document.visibilityState !== "hidden";
      start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    let intersection: IntersectionObserver | undefined;
    if (window.IntersectionObserver) {
      intersection = new IntersectionObserver(([entry]) => {
        onScreen = Boolean(entry?.isIntersecting);
        start();
      });
      intersection.observe(parent);
    }
    start();

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" style={{ width: "100%", height: "100%", display: "block" }} />;
}
