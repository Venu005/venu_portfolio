"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { profile } from "@/data/site";
import Signature from "@/components/site/Signature";
import { Wipe } from "@/components/site/Reveal";

const FluidHero = dynamic(() => import("@/components/site/FluidHero"), { ssr: false });

const D = 1.5; // wait for the loader
const ease = [0.22, 1, 0.36, 1] as const;
const lineA = "Ship it, learn from real users, then ship it better · ";
const lineB = "I build software people actually use · ";

/**
 * Hero + "message" as one pinned scene. The same portrait is used throughout:
 * it starts full-size with the fluid ink, shrinks into a framed photo as you scroll,
 * darkens, and then the signature writes itself across it.
 */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [helmet, setHelmet] = useState(false);
  const [dark, setDark] = useState(false);
  const [sign, setSign] = useState(false);
  useMotionValueEvent(p, "change", (v) => {
    setDark(v > 0.16);
    setSign(v > 0.44);
  });

  const bg = useTransform(p, [0, 0.28], ["#f4f4ed", "#282c20"]);
  const topo = useTransform(p, [0, 0.2, 0.3], [0, 0, 0.1]); // the hero draws its own contours on the canvas
  const uiFade = useTransform(p, [0, 0.1], [1, 0]);
  const uiEvents = useTransform(p, (v) => (v < 0.08 ? "auto" : "none"));
  const linesOpacity = useTransform(p, [0.14, 0.3], [0, 1]);
  const labelOpacity = useTransform(p, [0.36, 0.46], [0, 1]);

  return (
    <motion.section ref={ref} id="top" data-nav={dark ? "dark" : "light"} style={{ backgroundColor: bg }} className="relative h-[300vh]">
      <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden text-olive">
        {/* topographic lines */}
        <motion.div aria-hidden style={{ opacity: topo }} className="pointer-events-none absolute inset-0 bg-[url('/topo.svg')] bg-cover bg-center" />

        {/* giant sliding lines behind the framed photo */}
        <motion.div aria-hidden style={{ opacity: linesOpacity }} className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none">
          {/* continuous marquees, running in opposite directions */}
          <div className="flex w-max animate-marquee whitespace-nowrap font-serif text-[15vw] uppercase leading-[0.9] text-leaf [--marquee-duration:38s] sm:text-[9.5vw]">
            <span>{lineA.repeat(3)}</span>
            <span>{lineA.repeat(3)}</span>
          </div>
          <div className="flex w-max animate-marquee whitespace-nowrap font-display text-[15vw] font-black uppercase leading-[0.9] text-cream [--marquee-duration:30s] [animation-direction:reverse] sm:text-[9.5vw]">
            <span>{lineB.repeat(4)}</span>
            <span>{lineB.repeat(4)}</span>
          </div>
        </motion.div>

        {/* portrait + fluid ink (one canvas for the whole scene) */}
        <motion.div className="absolute inset-0 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease, delay: D }}>
          <FluidHero
            src={profile.heroCutout}
            altSrc={profile.heroAlt}
            imageAspect={profile.heroCutoutAspect}
            head={profile.heroHead}
            progress={p}
            onAlt={setHelmet}
            className="h-full w-full"
          />
        </motion.div>

        {/* "a message from Venu" label + signature */}
        <motion.div style={{ opacity: labelOpacity }} className="absolute inset-x-0 top-[11vh] z-20 flex flex-col items-center gap-2 text-center">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-lime font-display text-sm font-black text-ink">VY</span>
          <span className="font-display text-[11px] font-extrabold uppercase tracking-wide text-cream">A message from Venu</span>
        </motion.div>
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-[96vw] max-w-[1100px] -rotate-[4deg] text-lime drop-shadow-[0_8px_30px_rgba(0,0,0,.35)] sm:w-[64vw]">
            <Signature mode="trigger" active={sign} duration={1.1} />
          </div>
        </div>

        {/* hero UI (fades out as the scene starts) */}
        <motion.div style={{ opacity: uiFade, pointerEvents: uiEvents }} className="absolute inset-0 z-20 [&>*]:pointer-events-auto pointer-events-none">
          <div className="absolute left-1/2 top-[1.6vh] hidden -translate-x-1/2 flex-col items-center gap-1 text-center md:flex">
            <Signature mode="mount" delay={D + 0.6} duration={1.6} className="w-[78px] text-[#7a9a00]" />
            <AnimatePresence mode="wait">
              <motion.span
                key={helmet ? "on" : "off"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="eyebrow text-[10px] text-olive/70"
              >
                {helmet ? "Visor on · ready to ship" : "Move your cursor"}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.div
            className="absolute bottom-6 left-4 hidden sm:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + 0.9, duration: 0.8, ease }}
          >
            <NowCard />
          </motion.div>

          <motion.div
            className="absolute bottom-6 right-6 hidden max-w-[320px] flex-col items-end gap-3 rounded-2xl bg-cream/85 p-4 text-right backdrop-blur-md sm:flex"
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
    </motion.section>
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
