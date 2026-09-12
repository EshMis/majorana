"use client";

import { useEffect, useRef, type RefObject } from "react";
import { LIONESS_EYE_SHARD, LIONESS_SHARDS, LIONESS_SHARD_ASPECT, LIONESS_SHARD_GROUPS } from "./lioness-shards";

/**
 * The lioness, assembled from pieces, and now able to move.
 *
 * Every shard of the silhouette (`lioness-shards.ts`, a triangle mosaic of the
 * owner's reference art) starts scattered around the figure, turned and shrunk,
 * and settles into place along an eased path — tail first, head last, so the
 * animal walks in over about two seconds. Once assembled she stands where the
 * placeholder (`standRef`) is; a soft light passes across the mosaic every few
 * seconds and the eye stays a shade brighter than the rest.
 *
 * When the person starts typing she walks over to the composer (`restRef`) —
 * a few strides, legs swinging from the hips and shoulders, body rising and
 * falling with each step — and lies down along its top edge, hind legs folded
 * under, one paw and the tail hanging over the border into the composer's
 * padding, never over the text. She breathes there. When the composer is
 * cleared and left she gets up and walks back. Each shard belongs to a rig
 * group (body, head, tail, four legs, the near paw) and every pose is a rigid
 * transform per group, so the pieces stay pieces while she moves.
 *
 * Colours are read from the theme at draw time (`--accent`, `--bg-0`,
 * `--text-0`), so it follows light and dark without a prop. Drawing stops
 * while the canvas is off screen or the tab is hidden, and under reduced
 * motion the assembled figure is painted once, standing, with no sweep and no
 * walk.
 */
export function LionessField({
  engaged = false,
  typing = false,
  standRef,
  restRef,
  className = "",
}: {
  engaged?: boolean;
  typing?: boolean;
  /** Where she stands: the figure is letterboxed into this element's box. */
  standRef?: RefObject<HTMLElement | null>;
  /** Where she lies down: along the top edge of this element, at its right end. */
  restRef?: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engagedRef = useRef(engaged);
  engagedRef.current = engaged;
  const typingRef = useRef(typing);
  typingRef.current = typing;

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
    const STRIDE_MS = 880;
    const SETTLE_MS = 950;
    const RISE_MS = 700;
    const LEAVE_AFTER_MS = 1500;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    const smooth = (x: number) => x * x * (3 - 2 * x);
    let raf = 0;
    let started = 0;
    let visible = document.visibilityState !== "hidden";
    let onScreen = true;
    let width = 0;
    let height = 0;

    // Where she is and what she is doing.
    let mode: "stand" | "walk" | "settle" | "rest" | "rise" | "return" = "stand";
    let modeStart = 0;
    let facing: 1 | -1 = 1;
    let from: Spot = { x: 0, y: 0, w: 1 };
    let to: Spot = { x: 0, y: 0, w: 1 };
    let walkMs = STRIDE_MS * 3;
    let idleSince = 0;
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

    /**
     * Lying along the top edge of the composer, tucked into its right corner
     * at about three fifths her standing size: small enough to clear the
     * heading centred above the box, and to keep the paw and tail that hang
     * over the border inside the composer's padding, never over the text.
     */
    function restSpot(stand: Spot): Spot | null {
      const box = boxOf(restRef?.current);
      if (!box) return null;
      const w = Math.min(stand.w * 0.62, box.width * 0.26);
      const h = w / LIONESS_SHARD_ASPECT;
      return { x: box.right - w - Math.min(16, box.width * 0.03), y: box.top - h + 1, w };
    }

    function draw(now: number) {
      if (!started) started = now;
      const elapsed = now - started;
      const progress = reduceMotion ? 1 : Math.min(1, elapsed / ASSEMBLE_MS);
      const { accent, ground, ink } = colors();
      const stand = standSpot();
      const typing = typingRef.current;
      const engaged = engagedRef.current;

      // Advance the little state machine.
      let spot = stand;
      copyPose(STAND, pose);
      let stepAmplitude = 0;
      if (!reduceMotion) {
        if (mode === "stand" && typing && progress >= 1) {
          const rest = restSpot(stand);
          if (rest) {
            mode = "walk";
            modeStart = now;
            from = stand;
            to = rest;
            facing = to.x + to.w / 2 >= from.x + from.w / 2 ? 1 : -1;
            walkMs = Math.max(2, Math.round(Math.hypot(to.x - from.x, to.y - from.y) / (0.42 * from.w))) * STRIDE_MS;
          }
        }
        if (mode === "walk" || mode === "return") {
          const u = Math.min(1, (now - modeStart) / walkMs);
          spot = lerpSpot(from, to, smooth(u));
          // Strides fade in and out at the ends of the walk.
          stepAmplitude = Math.min(1, Math.min(u, 1 - u) * 6);
          walkPose((now - modeStart) / STRIDE_MS, stepAmplitude, pose);
          if (u >= 1) {
            if (mode === "walk") {
              mode = "settle";
              modeStart = now;
            } else {
              mode = "stand";
              facing = 1;
            }
          }
        } else if (mode === "settle" || mode === "rise") {
          const rest = restSpot(stand) ?? to;
          spot = rest;
          const u = Math.min(1, (now - modeStart) / (mode === "settle" ? SETTLE_MS : RISE_MS));
          settlePose(mode === "settle" ? u : 1 - u, pose);
          if (u >= 1) {
            if (mode === "settle") {
              mode = "rest";
              idleSince = 0;
            } else {
              mode = "return";
              modeStart = now;
              from = rest;
              to = stand;
              facing = to.x + to.w / 2 >= from.x + from.w / 2 ? 1 : -1;
              walkMs = Math.max(2, Math.round(Math.hypot(to.x - from.x, to.y - from.y) / (0.42 * from.w))) * STRIDE_MS;
            }
          }
        } else if (mode === "rest") {
          spot = restSpot(stand) ?? to;
          copyPose(REST, pose);
          // Breathing: the body rises and falls a hair, the tail tip stirs.
          pose[ROOT]![2] += 0.004 * Math.sin(now / 1300);
          pose[2]![0] += 0.03 * Math.sin(now / 2100);
          if (!typing && !engaged) {
            if (!idleSince) idleSince = now;
            else if (now - idleSince > LEAVE_AFTER_MS) {
              mode = "rise";
              modeStart = now;
              idleSince = 0;
            }
          } else {
            idleSince = 0;
          }
        }
      }

      const boxW = spot.w;
      const boxH = boxW / LIONESS_SHARD_ASPECT;
      const originX = spot.x;
      const originY = spot.y;
      const sweep = reduceMotion || progress < 1 ? -1 : ((elapsed - ASSEMBLE_MS) % SWEEP_MS) / SWEEP_MS;
      const sweepX = sweep < 0 ? -1 : -0.25 + sweep * 1.5;
      const lift = engaged || mode === "rest" ? 1 : 0.86;

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
          if (mode !== "stand") [x, y] = posedVertex(x, y, part.group, pose);
          const px = originX + (facing === 1 ? x : 1 - x) * boxW;
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
      canvas!.dataset.pose = mode;
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
  }, [standRef, restRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" style={{ width: "100%", height: "100%", display: "block" }} />;
}

/** The figure's box on the canvas: top-left corner and width; the height follows the aspect. */
type Spot = { x: number; y: number; w: number };

function lerpSpot(a: Spot, b: Spot, t: number): Spot {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t };
}

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
const identity = (): Part => [0, 0, 0, 1];
const STAND: Pose = Array.from({ length: 9 }, identity);
/**
 * Lying down: the root drops the body to the ground line, the hind legs fold
 * under (turned forward and tucked), the far fore leg lies along the ground,
 * the near fore leg reaches forward with the paw hanging over the edge, and
 * the tail hangs beside it. The head stays up. Tuned on the rendered mosaic.
 */
const REST: Pose = [
  identity(),
  [rad(-8), 0, 0, 1],
  [rad(18), 0, 0, 1],
  [rad(-100), 0.05, -0.04, 0.6],
  [rad(-96), 0.04, -0.03, 0.65],
  [rad(-82), 0.01, -0.01, 1],
  [rad(-60), 0, 0, 1],
  [rad(70), 0, 0, 1],
  [0, 0, 0.4, 1],
];
/** Lying down happens rump first: hind legs and body over the first part, fore legs and head after. */
const SETTLE_WINDOW: ReadonlyArray<readonly [number, number]> = [
  [0, 0.65], // body
  [0.3, 1], // head
  [0.2, 0.9], // tail
  [0, 0.65], // hind far
  [0.05, 0.7], // hind near
  [0.35, 1], // fore far
  [0.4, 1], // fore near
  [0.45, 1], // paw
  [0, 0.65], // root
];

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

function setPart(pose: Pose, group: number, rot: number, dx: number, dy: number, scale: number) {
  const part = pose[group]!;
  part[0] = rot;
  part[1] = dx;
  part[2] = dy;
  part[3] = scale;
}

/**
 * A walk cycle at `phase` strides: a lateral sequence, each leg a quarter
 * stride behind the last, the body bobbing twice per stride, the tail swaying
 * and the head nodding a little. `amplitude` scales it so strides can fade in.
 */
function walkPose(phase: number, amplitude: number, into: Pose) {
  const two = Math.PI * 2;
  const swing = (offset: number, deg: number) => rad(deg) * amplitude * Math.sin(two * (phase + offset));
  setPart(into, 0, 0, 0, 0, 1);
  setPart(into, 1, rad(2) * amplitude * Math.sin(two * 2 * phase), 0, 0.005 * amplitude * Math.sin(two * 2 * phase), 1);
  setPart(into, 2, swing(0, 8), 0, 0, 1);
  setPart(into, 3, swing(0.5, 20), 0, 0, 1);
  setPart(into, 4, swing(0, 20), 0, 0, 1);
  setPart(into, 5, swing(0.75, 24), 0, 0, 1);
  setPart(into, 6, swing(0.25, 24), 0, 0, 1);
  setPart(into, 7, swing(0.25, -9), 0, 0, 1);
  setPart(into, ROOT, 0, 0, 0.012 * amplitude * Math.sin(two * 2 * phase + 1), 1);
}

/** Between standing (u = 0) and lying (u = 1), each group on its own window. */
function settlePose(u: number, into: Pose) {
  for (let g = 0; g < REST.length; g += 1) {
    const [start, end] = SETTLE_WINDOW[g]!;
    const local = Math.min(1, Math.max(0, (u - start) / (end - start)));
    const t = local * local * (3 - 2 * local);
    const a = STAND[g]!;
    const b = REST[g]!;
    setPart(into, g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t);
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
