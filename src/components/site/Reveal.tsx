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

/** Lime block wipes across, then the text appears underneath it (labels / eyebrows). */
export function Wipe({
  children,
  className,
  delay = 0,
  animateOnMount = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animateOnMount?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const show = animateOnMount || inView;
  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      <motion.span
        className="relative z-0 inline-block"
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.01, delay: delay + 0.35 }}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-y-[-2px] left-0 z-10 w-full bg-lime"
        initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
        animate={
          show
            ? { scaleX: [0, 1, 1, 0], transformOrigin: ["0% 50%", "0% 50%", "100% 50%", "100% 50%"] }
            : { scaleX: 0 }
        }
        transition={{ duration: 0.8, times: [0, 0.45, 0.5, 1], ease: [0.76, 0, 0.24, 1], delay }}
      />
    </span>
  );
}

/** Headline whose words fill in (dim → solid) as you scroll through it. Use `*word*` for the serif accent. */
export function ScrollFill({ text, className, accentClassName }: { text: string; className?: string; accentClassName?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.5"] });
  const words = text.split(" ");
  return (
    <h2 ref={ref} className={className} aria-label={text.replace(/\*/g, "")}>
      {words.map((raw, i) => {
        const accent = raw.startsWith("*");
        const w = raw.replace(/\*/g, "");
        return (
          <FillWord key={i} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 2) / words.length)]} className={accent ? accentClassName : undefined}>
            {w}
          </FillWord>
        );
      })}
    </h2>
  );
}

function FillWord({
  children,
  progress,
  range,
  className,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, ["0.25em", "0em"]);
  return (
    <span aria-hidden className="inline-block overflow-hidden align-bottom">
      <motion.span style={{ opacity, y }} className={cn("inline-block", className)}>
        {children}&nbsp;
      </motion.span>
    </span>
  );
}
