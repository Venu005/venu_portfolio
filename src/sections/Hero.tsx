"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, MousePointer2 } from "lucide-react";
import { profile } from "@/data/site";
import Photo3D from "@/components/site/Photo3D";
import Signature from "@/components/site/Signature";

const D = 1.5; // wait for the loader
const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[640px] overflow-hidden bg-olive">
      {/* giant name behind the portrait */}
      <motion.div style={{ y: textY, opacity: fade }} className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-[24vh] pt-[11vh] sm:pb-[17vh] sm:pt-[12vh]">
        <Line delay={D} className="pl-3 text-left sm:pl-4">
          Venusai
        </Line>
        <Line delay={D + 0.1} className="pr-3 text-right sm:pr-4" serif>
          Yalamanchili
        </Line>
      </motion.div>

      {/* 3D portrait */}
      <motion.div
        style={{ y: photoY, scale: photoScale }}
        className="absolute inset-x-0 bottom-0 top-[10vh] z-10 mx-auto w-[min(88vw,62vh)] sm:top-[7vh] sm:w-[min(60vw,66vh)]"
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease, delay: D + 0.15 }}
      >
        {profile.heroImage && (
          <Photo3D
            src={profile.heroImage}
            depthSrc={profile.heroDepth ?? undefined}
            alt="Portrait of Venusai Yalamanchili"
            className="h-full w-full [mask-image:radial-gradient(ellipse_50%_52%_at_50%_46%,#000_50%,transparent_100%)]"
          />
        )}
        <Signature
          text={profile.nickname}
          delay={D + 1.1}
          className="absolute bottom-[22%] right-[-6%] -rotate-[10deg] text-[22vw] text-lime drop-shadow-[0_6px_24px_rgba(0,0,0,.4)] sm:bottom-[26%] sm:right-[-14%] sm:text-[9vw]"
        />
      </motion.div>

      {/* hover hint */}
      <motion.div
        className="absolute left-1/2 top-[9vh] z-20 hidden -translate-x-1/2 flex-col items-center gap-1 text-center md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: D + 1.4 }}
      >
        <MousePointer2 className="h-4 w-4 text-lime" />
        <span className="eyebrow text-[10px] text-cream/70">Hover the photo</span>
      </motion.div>

      {/* bottom-left notched card */}
      <motion.div
        className="absolute bottom-6 left-4 z-20 hidden sm:block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: D + 0.9, duration: 0.8, ease }}
      >
        <NowCard />
      </motion.div>

      {/* mobile CTA row */}
      <motion.div
        className="absolute inset-x-3 bottom-4 z-20 flex items-center justify-between gap-3 sm:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: D + 1, duration: 0.8, ease }}
      >
        <span className="flex items-center gap-2 font-display text-[11px] font-extrabold uppercase leading-tight text-cream">
          <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-lime" />
          Software engineer
          <br />
          open for freelance
        </span>
        <a href="#contact" className="btn-lime shrink-0">
          Let&apos;s talk <ArrowUpRight className="h-4 w-4" />
        </a>
      </motion.div>

      {/* bottom-right freelance CTA */}
      <motion.div
        className="absolute bottom-4 right-3 z-20 hidden max-w-[300px] flex-col items-end gap-3 text-right sm:bottom-6 sm:right-6 sm:flex"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: D + 1, duration: 0.8, ease }}
      >
        <span className="flex items-center gap-2 font-display text-xs font-extrabold uppercase tracking-wide text-cream">
          <span className="pulse-dot h-2 w-2 rounded-full bg-lime" /> Open for freelance
        </span>
        <p className="text-sm text-cream/70">Full-stack products, AI features and real-time systems, designed, built and shipped.</p>
        <a href="#contact" className="btn-lime">
          Start a project <ArrowUpRight className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  );
}

function Line({ children, className, delay, serif }: { children: string; className?: string; delay: number; serif?: boolean }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.h1
        className={
          serif
            ? "font-serif text-[16.5vw] uppercase leading-[0.8] text-leaf sm:text-[12.4vw]"
            : "font-display text-[25vw] font-black uppercase leading-[0.8] text-cream sm:text-[19.5vw]"
        }
        initial={{ y: "105%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.2, ease, delay }}
      >
        {children}
      </motion.h1>
    </div>
  );
}

function NowCard() {
  return (
    <div className="relative w-[138px] text-cream sm:w-[150px]">
      <svg viewBox="0 0 119 244" className="absolute inset-0 h-full w-full text-cream/35" preserveAspectRatio="none" aria-hidden>
        <path
          d="M118.5 6v232a5.5 5.5 0 0 1-5.5 5.5H6A5.5 5.5 0 0 1 .5 238V25A5.5 5.5 0 0 1 6 19.5h46.346c4.695 0 9.167-2 12.297-5.498l7.46-8.337A15.5 15.5 0 0 1 83.653.5H113a5.5 5.5 0 0 1 5.5 5.5Z"
          fill="none"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative flex flex-col gap-3 px-3 pb-3 pt-2">
        <span className="eyebrow text-[10px] text-cream/60">Right now</span>
        <div className="mt-3">
          <p className="font-display text-sm font-black uppercase leading-tight">Software Engineer</p>
          <p className="font-serif text-lg leading-none text-lime">@ {profile.company}</p>
        </div>
        <span className="h-px w-full bg-cream/25" />
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-lime font-display text-[11px] font-black text-ink">AI</span>
          <span className="eyebrow text-[9px] leading-tight text-cream/70">
            Full-stack
            <br />+ LLM systems
          </span>
        </div>
        <span className="h-px w-full bg-cream/25" />
        <span className="eyebrow text-[9px] leading-tight text-cream/60">
          B.Tech CSE
          <br />
          IIITDM Kurnool ’26
        </span>
      </div>
    </div>
  );
}
