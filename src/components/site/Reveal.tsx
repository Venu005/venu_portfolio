"use client";
import { motion, useInView, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade + rise into view once. */
export function FadeUp({
  children,
  className,
  delay = 0,
  y = 40,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Each line/word slides up from behind a mask. */
export function SplitReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.06,
  as: Tag = "h2",
  animateOnMount = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  animateOnMount?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const show = animateOnMount || inView;
  const words = text.split(" ");
  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top" aria-hidden>
          <motion.span
            className={cn("inline-block", wordClassName)}
            initial={{ y: "110%" }}
            animate={show ? { y: "0%" } : { y: "110%" }}
            transition={{ duration: 1, ease, delay: delay + i * stagger }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Words light up one by one as you scroll through the paragraph. */
export function ScrollHighlight({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}
