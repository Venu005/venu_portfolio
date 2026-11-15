"use client";
import { animate, motion, useInView, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { SIG_FILL, SIG_PEN_WIDTH, SIG_STROKES, SIG_VIEWBOX } from "./signaturePath";

// relative length of each pen stroke, so they're written one after another at a constant speed
const lengths = SIG_STROKES.map((d) => {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  let len = 0;
  for (let i = 2; i < n.length; i += 2) len += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
  return len;
});
const total = lengths.reduce((a, b) => a + b, 0);
const spans = lengths.reduce<[number, number][]>((acc, l) => {
  const start = acc.length ? acc[acc.length - 1][1] : 0;
  acc.push([start, start + l / total]);
  return acc;
}, []);

type Props = {
  className?: string;
  /** "mount": writes once on load · "inView": writes when scrolled into view · "scroll": scrubbed by `progress` ·
   *  "trigger": writes quickly whenever `active` becomes true, rewinds when it turns false */
  mode?: "mount" | "inView" | "scroll" | "trigger";
  active?: boolean;
  progress?: MotionValue<number>;
  /** for mode="scroll": the part of `progress` over which it writes */
  range?: [number, number];
  delay?: number;
  duration?: number;
  label?: string;
};

/** Venu's signature, written stroke by stroke. Colour comes from `currentColor`. */
export default function Signature({ className, mode = "inView", active = false, progress, range = [0, 1], delay = 0, duration = 1.8, label = "Venu's signature" }: Props) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const local = useMotionValue(0);

  useEffect(() => {
    if (mode !== "trigger") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = active
      ? animate(local, 1, { duration: reduce ? 0 : duration, ease: [0.5, 0, 0.2, 1] })
      : animate(local, 0, { duration: reduce ? 0 : 0.35, ease: "easeIn" });
    return () => c.stop();
  }, [mode, active, duration, local]);

  useEffect(() => {
    if (mode === "scroll" || mode === "trigger") return;
    if (mode === "inView" && !inView) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      local.set(1);
      return;
    }
    const c = animate(local, 1, { duration, delay, ease: [0.45, 0, 0.25, 1] });
    return () => c.stop();
  }, [mode, inView, delay, duration, local]);

  const scrolled = useTransform(progress ?? local, range, [0, 1], { clamp: true });
  const p = mode === "scroll" && progress ? scrolled : local;

  return (
    <svg ref={ref} viewBox={SIG_VIEWBOX} className={cn("block h-auto overflow-visible", className)} role="img" aria-label={label}>
      <defs>
        <mask id={`sig-${id}`} maskUnits="userSpaceOnUse">
          {SIG_STROKES.map((d, i) => (
            <Pen key={i} d={d} progress={p} span={spans[i]} />
          ))}
        </mask>
      </defs>
      <path d={SIG_FILL} fill="currentColor" fillRule="evenodd" mask={`url(#sig-${id})`} />
    </svg>
  );
}

function Pen({ d, progress, span }: { d: string; progress: MotionValue<number>; span: [number, number] }) {
  const pathLength = useTransform(progress, span, [0, 1], { clamp: true });
  const opacity = useTransform(pathLength, (v) => (v > 0.001 ? 1 : 0));
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#fff"
      strokeWidth={SIG_PEN_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pathLength, opacity }}
    />
  );
}
