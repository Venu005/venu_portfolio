"use client";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ArrowUpRight, MousePointer2 } from "lucide-react";
import { profile } from "@/data/site";
import Signature from "@/components/site/Signature";
import { Wipe } from "@/components/site/Reveal";

const HeroPortrait = dynamic(() => import("@/components/site/HeroPortrait"), { ssr: false });

const D = 1.5; // wait for the loader
const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  // the hero is pinned for one extra screen of scroll: the helmet goes on as you scroll
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const headScale = useTransform(scrollYProgress, [0.4, 1], [1, 0.86]);
  const headY = useTransform(scrollYProgress, [0.4, 1], ["0%", "6%"]);
  const uiFade = useTransform(scrollYProgress, [0.55, 0.9], [1, 0]);
  const [helmet, setHelmet] = useState(false);

  return (
    <section ref={ref} id="top" data-nav="light" className="relative h-[190svh] bg-cream">
      <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden text-olive">
        {/* topographic lines */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/topo.svg')] bg-cover bg-center opacity-90" />

        {/* giant name behind the head */}
        <motion.div style={{ y: nameY }} className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-[24vh] pt-[11vh] sm:pb-[15vh] sm:pt-[12vh]">
          <Line delay={D} className="pl-3 text-left sm:pl-4">
            Venusai
          </Line>
          <Line delay={D + 0.1} className="pr-3 text-right sm:pr-4" serif>
            Yalamanchili
          </Line>
        </motion.div>

        {/* 3D head + helmet */}
        <motion.div
          style={{ scale: headScale, y: headY }}
          className="absolute inset-x-0 bottom-0 top-[3vh] z-10 origin-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.3, ease, delay: D + 0.1 }}
        >
          <HeroPortrait
            src={profile.heroCutout}
            altSrc={profile.heroAlt}
            imageAspect={profile.heroCutoutAspect}
            head={profile.heroHead}
            scrollProgress={scrollYProgress}
            onAlt={setHelmet}
            className="h-full w-full"
          />
        </motion.div>

        <motion.div style={{ opacity: uiFade }} className="pointer-events-none absolute inset-0 z-20 [&_a]:pointer-events-auto">
          {/* signature */}
          <div className="absolute bottom-[30%] right-[6%] sm:right-[20%]">
            <Signature text={profile.nickname} delay={D + 1.1} className="-rotate-[10deg] text-[20vw] text-[#7a9a00] sm:text-[7vw]" />
          </div>

          {/* status chip top-centre */}
          <div className="absolute left-1/2 top-[9.5vh] hidden -translate-x-1/2 flex-col items-center gap-1.5 text-center md:flex">
            <MousePointer2 className="h-4 w-4 text-olive" />
            <AnimatePresence mode="wait">
              <motion.span
                key={helmet ? "on" : "off"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="eyebrow text-[10px] text-olive/70"
              >
                {helmet ? (profile.heroAlt ? "Helmet on · ready to ship" : "Debug mode on") : "Hover my head"}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* bottom-left notched card */}
          <motion.div
            className="absolute bottom-6 left-4 hidden sm:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + 0.9, duration: 0.8, ease }}
          >
            <NowCard />
          </motion.div>

          {/* bottom-right CTA */}
          <motion.div
            className="absolute bottom-6 right-6 hidden max-w-[300px] flex-col items-end gap-3 text-right sm:flex"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + 1, duration: 0.8, ease }}
          >
            <span className="flex items-center gap-2 font-display text-xs font-extrabold uppercase tracking-wide">
              <span className="pulse-dot h-2 w-2 rounded-full bg-[#7a9a00]" />
              <Wipe animateOnMount delay={D + 1.1}>
                Open for freelance
              </Wipe>
            </span>
            <p className="text-sm text-olive/70">Full-stack products, AI features and real-time systems, designed, built and shipped.</p>
            <a href="#contact" className="btn-lime">
              Start a project <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>

          {/* mobile CTA row */}
          <motion.div
            className="absolute inset-x-3 bottom-4 flex items-center justify-between gap-3 sm:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + 1, duration: 0.8, ease }}
          >
            <span className="flex items-center gap-2 font-display text-[11px] font-extrabold uppercase leading-tight">
              <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-[#7a9a00]" />
              Software engineer
              <br />
              open for freelance
            </span>
            <a href="#contact" className="btn-lime shrink-0">
              Let&apos;s talk <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Line({ children, className, delay, serif }: { children: string; className?: string; delay: number; serif?: boolean }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.h1
        className={
          serif
            ? "font-serif text-[16.5vw] uppercase leading-[0.8] text-[#7a9a00] sm:text-[12.4vw]"
            : "font-display text-[25vw] font-black uppercase leading-[0.8] text-olive sm:text-[19.5vw]"
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
    <div className="relative w-[150px] text-olive">
      <svg viewBox="0 0 119 244" className="absolute inset-0 h-full w-full text-olive/40" preserveAspectRatio="none" aria-hidden>
        <path
          d="M118.5 6v232a5.5 5.5 0 0 1-5.5 5.5H6A5.5 5.5 0 0 1 .5 238V25A5.5 5.5 0 0 1 6 19.5h46.346c4.695 0 9.167-2 12.297-5.498l7.46-8.337A15.5 15.5 0 0 1 83.653.5H113a5.5 5.5 0 0 1 5.5 5.5Z"
          fill="none"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative flex flex-col gap-3 px-3 pb-3 pt-2">
        <span className="eyebrow text-[10px] text-olive/60">
          <Wipe animateOnMount delay={D + 1}>
            Right now
          </Wipe>
        </span>
        <div className="mt-3">
          <p className="font-display text-sm font-black uppercase leading-tight">Software Engineer</p>
          <p className="font-serif text-lg leading-none text-[#7a9a00]">@ {profile.company}</p>
        </div>
        <span className="h-px w-full bg-olive/20" />
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-lime font-display text-[11px] font-black text-ink">AI</span>
          <span className="eyebrow text-[9px] leading-tight text-olive/70">
            Full-stack
            <br />+ LLM systems
          </span>
        </div>
        <span className="h-px w-full bg-olive/20" />
        <span className="eyebrow text-[9px] leading-tight text-olive/60">
          Based in
          <br />
          Hyderabad, India
        </span>
      </div>
    </div>
  );
}
