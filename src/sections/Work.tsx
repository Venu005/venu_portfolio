"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Lock, X } from "lucide-react";
import { projects, profile, type Project } from "@/data/site";
import { useLenis } from "@/components/site/SmoothScroll";
import Signature from "@/components/site/Signature";
import { Wipe } from "@/components/site/Reveal";

/**
 * Pinned horizontal gallery: scrolling down glides a row of large project cards sideways,
 * with an intro panel, a quote break and a closing call to action.
 */
export default function Work() {
  const [active, setActive] = useState<Project | null>(null);
  const lenis = useLenis();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (active) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, lenis]);

  // how far the track needs to travel
  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDist(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  useMotionValueEvent(scrollYProgress, "change", (v) => setCount(Math.min(projects.length, Math.max(1, Math.round(v * projects.length + 0.5)))));

  const cards = projects.map((p, i) => <Card key={p.name} project={p} index={i} onOpen={() => setActive(p)} />);
  // quote break after the third project
  cards.splice(3, 0, <Quote key="quote" />);

  return (
    <section id="work" ref={section} className="relative bg-ink" style={{ height: `calc(100svh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/topo.svg')] bg-cover bg-center opacity-[0.06]" />

        <motion.div ref={track} style={{ x }} className="relative flex h-full items-center gap-6 pl-4 pr-[8vw] will-change-transform sm:gap-10 sm:pl-10">
          {/* intro panel */}
          <div className="flex w-[82vw] shrink-0 flex-col justify-center sm:w-[36vw]">
            <span className="eyebrow text-cream/60">
              <Wipe>Selected work</Wipe>
            </span>
            <h2 className="mt-6 font-display text-[19vw] font-black uppercase leading-[0.8] text-cream sm:text-[8.5vw]">
              Things
              <br />
              I&apos;ve <span className="font-serif font-normal text-leaf">shipped</span>
            </h2>
            <p className="mt-8 max-w-sm text-cream/70">
              Enterprise platforms, AI products and the native apps I build after hours. Scroll to browse, tap a card for the story.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 font-display text-xs font-extrabold uppercase tracking-wide text-lime">
              Keep scrolling <ArrowRight className="h-4 w-4" />
            </span>
          </div>

          {cards}

          {/* closing panel */}
          <div className="flex w-[78vw] shrink-0 flex-col items-start justify-center gap-6 sm:w-[30vw]">
            <p className="font-serif text-4xl leading-tight text-cream sm:text-5xl">
              More experiments
              <br />
              and open source on <span className="text-lime">GitHub</span>
            </p>
            <a href={profile.socials[0].href} target="_blank" rel="noreferrer" className="btn-lime">
              View on GitHub <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>

        {/* progress */}
        <div className="pointer-events-none absolute inset-x-4 bottom-6 flex items-center gap-4 sm:inset-x-10">
          <span className="font-display text-xs font-extrabold tabular-nums text-cream">
            {String(count).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </span>
          <div className="h-px flex-1 bg-cream/15">
            <motion.div style={{ width: bar }} className="h-px bg-lime" />
          </div>
        </div>
      </div>

      <AnimatePresence>{active && <Detail project={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </section>
  );
}

function Card({ project: p, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  const offset = index % 2 === 1 ? "sm:translate-y-[7vh]" : "sm:-translate-y-[4vh]";
  return (
    <button onClick={onOpen} aria-label={`Open ${p.name} details`} className={`group w-[82vw] shrink-0 text-left sm:w-[40vw] lg:w-[34vw] ${offset}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow text-[10px] text-cream/60">
          {p.kind}, {p.year}
        </span>
        {p.aiImage && <span className="text-[9px] font-semibold uppercase tracking-wider text-cream/40">AI-generated mockup</span>}
      </div>
      <div className="notch relative aspect-[16/11] overflow-hidden bg-moss">
        {p.image ? (
          <Image
            src={p.image}
            alt=""
            fill
            sizes="(min-width:1024px) 34vw, (min-width:640px) 40vw, 82vw"
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-serif text-[30vw] text-lime/30 sm:text-[12vw]">{String(index + 1).padStart(2, "0")}</div>
        )}
        <span className="absolute right-3 top-3 grid h-10 w-10 scale-75 place-items-center rounded-full bg-lime text-ink opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 flex items-start gap-4">
        <span className="font-serif text-4xl leading-none text-lime">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h3 className="font-display text-3xl font-black uppercase leading-[0.9] text-cream transition-colors group-hover:text-lime sm:text-4xl">{p.name}</h3>
          <p className="mt-2 font-serif text-xl leading-tight text-leaf">{p.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.stack.slice(0, 4).map((t) => (
              <span key={t} className="rounded-md border border-cream/15 px-2 py-1 text-[11px] text-cream/70">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function Quote() {
  return (
    <div className="flex w-[78vw] shrink-0 flex-col justify-center gap-6 sm:w-[28vw]">
      <p className="font-serif text-4xl leading-[1.05] text-cream sm:text-5xl">
        “I spent 20 days on factory floors before designing a <span className="text-lime">single screen</span>.”
      </p>
      <div className="w-40 text-lime">
        <Signature />
      </div>
    </div>
  );
}

function Detail({ project: p, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={p.name}
    >
      <motion.div
        className="relative max-h-[90svh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-olive p-6 text-cream sm:rounded-3xl sm:p-10"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-cream text-ink">
          <X className="h-5 w-5" />
        </button>
        {p.image && (
          <div className="relative -mx-6 -mt-6 mb-6 aspect-[16/10] overflow-hidden rounded-t-3xl bg-ink sm:-mx-10 sm:-mt-10 sm:mb-8">
            <Image src={p.image} alt={`${p.name} preview`} fill sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
            {p.aiImage && (
              <span className="absolute bottom-3 left-3 rounded-sm bg-ink/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream/90 backdrop-blur-sm">
                AI-generated mockup
              </span>
            )}
          </div>
        )}
        <span className="eyebrow text-cream/60">
          {p.kind} · {p.year}
        </span>
        <h3 className="mt-4 font-display text-5xl font-black uppercase leading-[0.85] sm:text-7xl">{p.name}</h3>
        <p className="mt-3 font-serif text-2xl text-lime sm:text-3xl">{p.tagline}</p>
        <p className="mt-6 leading-relaxed text-cream/80">{p.description}</p>
        {p.highlights && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {p.highlights.map((h) => (
              <li key={h} className="rounded-md bg-lime px-3 py-1.5 font-display text-xs font-extrabold uppercase text-ink">
                {h}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {p.stack.map((s) => (
            <span key={s} className="chip border-cream/25 text-cream/80">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {p.links.length ? (
            p.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn-lime">
                {l.label} <ArrowUpRight className="h-4 w-4" />
              </a>
            ))
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-cream/70">
              <Lock className="h-4 w-4" /> Private client work. Happy to walk you through it on a call.
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
