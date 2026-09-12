"use client";

import { useEffect, useRef, type RefObject } from "react";
import { LIONESS_EYE_SHARD, LIONESS_SHARDS, LIONESS_SHARD_ASPECT, LIONESS_SHARD_GROUPS } from "./lioness-shards";

/**
 * The lioness, assembled from pieces, standing above the composer.
 *
 * Every shard of the silhouette (`lioness-shards.ts`, a triangle mosaic of the
 * owner's reference art) starts scattered around the figure, turned and shrunk,
 * and settles into place along an eased path — tail first, head last, so the
 * animal walks in over about two seconds. Once assembled she stands where the
 * placeholder (`standRef`) is; a soft light passes across the mosaic every few
 * seconds and the eye stays a shade brighter than the rest.
 *
 * She notices the pointer. Bring it over her and the tail flicks — a quick lift
 * with a small settle-back, the way a resting cat's tail answers a hand — the
 * head lifts a degree or two toward the pointer, and the pieces brighten as
 * they do while the composer is engaged. While the pointer stays she flicks
 * again every few seconds, never on a fixed beat. Each shard belongs to a rig
 * group (body, head, tail, four legs, the near paw) and every move is a rigid
 * transform per group, so the pieces stay pieces while she moves.
 *
 * The walk to the composer and the lie-down that shipped in PR 868 were taken
 * out on owner direction (2026-09-12); the rig they were built on stays for the
 * hover, and that commit has the poses if they are ever wanted back.
 *
 * Colours are read from the theme at draw time (`--accent`, `--bg-0`,
 * `--text-0`), so it follows light and dark without a prop. Drawing stops
 * while the canvas is off screen or the tab is hidden, and under reduced
 * motion the assembled figure is painted once, standing, with no sweep and no
 * hover motion. The canvas takes no pointer events; the hover is read from the
 * page's pointer position against the figure's own box.
 */
export function LionessField({
  engaged = false,
  standRef,
  className = "",
}: {
  engaged?: boolean;
  /** Where she stands: the figure is letterboxed into this element's box. */
  standRef?: RefObject<HTMLElement | null>;
  className?: string;
}) {
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
        group: LIONESS_SHARD_GROUPS[index] ?? 0,
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
    const FLICK_MS = 1100;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    let raf = 0;
    let started = 0;
    let lastFrame = 0;
    let visible = document.visibilityState !== "hidden";
    let onScreen = true;
    let width = 0;
    let height = 0;

    // The pointer relative to the canvas (null once it has left the page), and
    // what she makes of it.
    let pointer: { x: number; y: number } | null = null;
    let hovering = false;
    let flickStart = -1;
    let flickAmplitude = 1;
    let nextFlickAt = 0;
    let headLift = 0;
    let attention = 0;
    const pose = clonePose(STAND);

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

    /** The box of an element relative to the canvas; walks into a `display: contents` wrapper. */
    function boxOf(element: HTMLElement | null | undefined): DOMRect | null {
      let el: Element | null | undefined = element;
      for (let depth = 0; el && depth < 4; depth += 1) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const base = canvas!.getBoundingClientRect();
          return new DOMRect(rect.left - base.left, rect.top - base.top, rect.width, rect.height);
        }
        el = el.firstElementChild;
      }
      return null;
    }

    /** Letterbox the figure into a box at its own aspect. */
    function fit(box: DOMRect, pad = 0.96): Spot {
      let w = box.width * pad;
      let h = w / LIONESS_SHARD_ASPECT;
      if (h > box.height * pad) {
        h = box.height * pad;
        w = h * LIONESS_SHARD_ASPECT;
      }
      return { x: box.x + (box.width - w) / 2, y: box.y + (box.height - h) / 2, w };
    }

    function standSpot(): Spot {
      const box = boxOf(standRef?.current) ?? new DOMRect(0, 0, width, height);
      return fit(box);
    }

    function beginFlick(now: number) {
      flickStart = now;
      flickAmplitude = 0.75 + random() * 0.35;
      // The next unprompted flick, if the pointer stays: a few seconds, varied.
      nextFlickAt = now + FLICK_MS + 1800 + random() * 2400;
    }

    function draw(now: number) {
      if (!started) started = now;
      const dt = lastFrame ? Math.min(64, now - lastFrame) : 16;
      lastFrame = now;
      const elapsed = now - started;
      const progress = reduceMotion ? 1 : Math.min(1, elapsed / ASSEMBLE_MS);
      const { accent, ground, ink } = colors();
      const spot = standSpot();
      const boxW = spot.w;
      const boxH = boxW / LIONESS_SHARD_ASPECT;
      const engaged = engagedRef.current;

      // Is the pointer over her? Her box, with a little margin so the paws and
      // the tail tip count. Only once she is assembled.
      if (!reduceMotion) {
        const margin = boxH * 0.08;
        const over =
          pointer !== null &&
          progress >= 1 &&
          pointer.x >= spot.x - margin &&
          pointer.x <= spot.x + boxW + margin &&
          pointer.y >= spot.y - margin &&
          pointer.y <= spot.y + boxH + margin;
        if (over && !hovering) {
          hovering = true;
          if (flickStart < 0) beginFlick(now);
        } else if (!over && hovering) {
          hovering = false;
        }
        if (hovering && flickStart < 0 && now >= nextFlickAt) beginFlick(now);
      }

      // The pose for this frame: standing, plus whatever the hover adds.
      copyPose(STAND, pose);
      if (flickStart >= 0) {
        const t = (now - flickStart) / FLICK_MS;
        if (t >= 1) flickStart = -1;
        else pose[2]![0] = tailFlick(t) * flickAmplitude;
      }
      // The head follows the pointer's height a little: up to five degrees
      // either way, eased so it reads as attention rather than tracking.
      const headTarget =
        hovering && pointer ? clamp((spot.y + PIVOTS[1]![1] * boxH - pointer.y) / boxH, -1, 1) * rad(5) : 0;
      const ease = 1 - Math.exp(-dt / 140);
      headLift += (headTarget - headLift) * ease;
      if (Math.abs(headLift) > 1e-4) pose[1]![0] = -headLift;
      attention += ((hovering ? 1 : 0) - attention) * ease;
      const posed = flickStart >= 0 || Math.abs(headLift) > 1e-4;

      const originX = spot.x;
      const originY = spot.y;
      const sweep = reduceMotion || progress < 1 ? -1 : ((elapsed - ASSEMBLE_MS) % SWEEP_MS) / SWEEP_MS;
      const sweepX = sweep < 0 ? -1 : -0.25 + sweep * 1.5;
      const lift = 0.86 + 0.14 * Math.max(engaged ? 1 : 0, attention);

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
          let x = part.cx + offX + rx * cos - ry * sin;
          let y = part.cy + offY + rx * sin + ry * cos;
          if (posed) [x, y] = posedVertex(x, y, part.group, pose);
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
      canvas!.dataset.pose = hovering ? "hover" : "stand";
      if (!reduceMotion && visible && onScreen) raf = window.requestAnimationFrame(draw);
    }

    function start() {
      window.cancelAnimationFrame(raf);
      if (reduceMotion) {
        draw(performance.now());
        return;
      }
      lastFrame = 0;
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
    // The pointer, read from the page: the canvas itself takes no pointer
    // events, so nothing underneath her stops working.
    const onPointerMove = (event: PointerEvent) => {
      const base = canvas!.getBoundingClientRect();
      pointer = { x: event.clientX - base.left, y: event.clientY - base.top };
    };
    const onPointerGone = () => {
      pointer = null;
    };
    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onPointerGone);
      window.addEventListener("blur", onPointerGone);
    }
    start();

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerGone);
      window.removeEventListener("blur", onPointerGone);
    };
  }, [standRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" style={{ width: "100%", height: "100%", display: "block" }} />;
}

/** The figure's box on the canvas: top-left corner and width; the height follows the aspect. */
type Spot = { x: number; y: number; w: number };

/** One rigid move per rig group: turn about the pivot, then shift, scaled about the pivot. */
type Part = [rot: number, dx: number, dy: number, scale: number];
type Pose = Part[];

/** Rig groups follow `LIONESS_SHARD_GROUPS`; the root (index 8) moves the whole figure. */
const ROOT = 8;
const PIVOTS: ReadonlyArray<readonly [number, number]> = [
  [0.5, 0.35], // body
  [0.8, 0.3], // head, at the neck
  [0.2, 0.32], // tail, at the root
  [0.19, 0.5], // hind leg (far), at the hip
  [0.36, 0.48], // hind leg (near), at the hip
  [0.6, 0.5], // fore leg (far), at the shoulder
  [0.79, 0.48], // fore leg (near, upper), at the shoulder
  [0.84, 0.82], // fore leg (near, paw), at the wrist
];
const PARENT: ReadonlyArray<number> = [-1, -1, -1, -1, -1, -1, -1, 6];
const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const identity = (): Part => [0, 0, 0, 1];
const STAND: Pose = Array.from({ length: 9 }, identity);

/**
 * A tail flick over `t` in [0, 1): a damped swing about the root. A positive
 * turn lifts the tip (it hangs down and back, so clockwise on screen is up).
 * The first lobe is the whip, about twenty-three degrees a quarter of the way
 * in; the second, about five degrees the other way, is the settle-back.
 */
function tailFlick(t: number): number {
  return rad(48) * Math.sin(t * Math.PI * 2.2) * Math.exp(-3.2 * t);
}

function clonePose(source: Pose): Pose {
  return source.map((part) => [...part] as Part);
}

function copyPose(source: Pose, into: Pose) {
  for (let g = 0; g < source.length; g += 1) {
    const s = source[g]!;
    const d = into[g]!;
    d[0] = s[0];
    d[1] = s[1];
    d[2] = s[2];
    d[3] = s[3];
  }
}

function applyPart(x: number, y: number, part: Part, pivot: readonly [number, number]): [number, number] {
  const [rot, dx, dy, scale] = part;
  if (rot === 0 && dx === 0 && dy === 0 && scale === 1) return [x, y];
  // Turn in the figure's own proportions, not the normalised square.
  const px = (x - pivot[0]) * LIONESS_SHARD_ASPECT;
  const py = y - pivot[1];
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const rx = (px * cos - py * sin) * scale;
  const ry = (px * sin + py * cos) * scale;
  return [pivot[0] + rx / LIONESS_SHARD_ASPECT + dx, pivot[1] + ry + dy];
}

/** A vertex through its group's move, its parent's, then the root's. */
function posedVertex(x: number, y: number, group: number, pose: Pose): [number, number] {
  let g = group;
  while (g >= 0) {
    [x, y] = applyPart(x, y, pose[g]!, PIVOTS[g]!);
    g = PARENT[g] ?? -1;
  }
  return applyPart(x, y, pose[ROOT]!, PIVOTS[0]!);
}
