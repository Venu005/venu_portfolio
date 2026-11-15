"use client";
import { motion, useInView, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { SIGNATURE_PATH, SIGNATURE_VIEWBOX } from "./signaturePath";

type Props = {
  className?: string;
  /** "mount": draws once on load · "inView": draws when scrolled into view · "scroll": tied to `progress` */
  mode?: "mount" | "inView" | "scroll";
  progress?: MotionValue<number>;
  /** for mode="scroll": the part of `progress` over which it draws */
  range?: [number, number];
  delay?: number;
  duration?: number;
  strokeWidth?: number;
  label?: string;
};

/** Handwritten "Venu" signature that writes itself, stroke by stroke. Colour comes from `currentColor`. */
export default function Signature({
  className,
  mode = "inView",
  progress,
  range = [0, 1],
  delay = 0,
  duration = 2.2,
  strokeWidth = 5,
  label = "Venu's signature",
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const show = mode === "mount" || inView;

  return (
    <svg ref={ref} viewBox={SIGNATURE_VIEWBOX} className={cn("block h-auto overflow-visible", className)} role="img" aria-label={label}>
      {mode === "scroll" && progress ? (
        <ScrollPath progress={progress} range={range} strokeWidth={strokeWidth} />
      ) : (
        <motion.path
          d={SIGNATURE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={show ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{
            pathLength: { duration, ease: [0.65, 0, 0.35, 1], delay },
            opacity: { duration: 0.01, delay },
          }}
        />
      )}
    </svg>
  );
}

function ScrollPath({ progress, range, strokeWidth }: { progress: MotionValue<number>; range: [number, number]; strokeWidth: number }) {
  const pathLength = useTransform(progress, range, [0, 1], { clamp: true });
  const opacity = useTransform(pathLength, [0, 0.01], [0, 1]);
  return (
    <motion.path
      d={SIGNATURE_PATH}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pathLength, opacity }}
    />
  );
}
