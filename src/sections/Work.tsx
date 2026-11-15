"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, Lock, X } from "lucide-react";
import { projects, profile, type Project } from "@/data/site";
import { FadeUp } from "@/components/site/Reveal";
import { useLenis } from "@/components/site/SmoothScroll";
import { cn } from "@/lib/utils";

export default function Work() {
  const [active, setActive] = useState<Project | null>(null);
  const lenis = useLenis();

  useEffect(() => {
    if (active) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, lenis]);

  return (
    <section id="work" className="bg-ink pb-24 pt-24 sm:pt-32">
      <div className="px-3 sm:px-4">
        <div className="mb-10 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <FadeUp>
            <h2 className="font-display text-[15vw] font-black uppercase leading-[0.82] text-cream sm:text-[9vw] lg:text-[6.5vw]">
              Projects
              <br />
              <span className="font-serif font-normal text-leaf">Hall of fame</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1} className="max-w-xs text-sm text-cream/75 md:mb-2">
            From enterprise platforms to native apps I build after hours. Every project here shipped to real users. Tap a card for the story.
          </FadeUp>
          <div />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <FadeUp key={p.name} delay={(i % 3) * 0.08} y={30}>
              <button onClick={() => setActive(p)} className="group block w-full text-left" aria-label={`Open ${p.name} details`}>
                <div className="notch relative aspect-[1/0.95] bg-cream/15 p-px transition-colors duration-500 group-hover:bg-lime">
                  <div className="notch relative h-full w-full overflow-hidden bg-ink">
                    <CardVisual project={p} index={i} />
                    {p.aiImage && (
                      <span className="absolute bottom-7 left-3 rounded-sm bg-ink/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cream/90 backdrop-blur-sm">
                        AI-generated mockup
                      </span>
                    )}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                      <span className="eyebrow text-[10px] text-cream/50">{p.kind}</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-ink opacity-0 transition-all duration-500 group-hover:opacity-100">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="-mt-[18px] flex items-center justify-end gap-2 pr-1 font-display text-xs font-extrabold uppercase sm:text-sm">
                  <span className="text-cream">{p.name}</span>
                  <span className="text-lime">{p.year}</span>
                </div>
              </button>
            </FadeUp>
          ))}
        </div>

        <FadeUp className="mt-20 flex flex-col items-center gap-5 text-center">
          <p className="font-serif text-3xl leading-tight text-cream sm:text-4xl">
            See more experiments and open source
            <br />
            on my GitHub
          </p>
          <a href={profile.socials[0].href} target="_blank" rel="noreferrer" className="btn-lime">
            View on GitHub <ArrowUpRight className="h-4 w-4" />
          </a>
        </FadeUp>
      </div>

      <AnimatePresence>{active && <Detail project={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </section>
  );
}

function CardVisual({ project: p, index }: { project: Project; index: number }) {
  if (p.image)
    return (
      <Image
        src={p.image}
        alt=""
        fill
        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        className="object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
      />
    );
  if (p.name === "Unison") return <UnisonVisual />;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="font-serif text-[40vw] leading-[0.7] text-moss transition-all duration-700 group-hover:scale-110 group-hover:text-lime sm:text-[20vw] lg:text-[13vw]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="max-w-[80%] font-display text-xl font-black uppercase leading-none text-cream sm:text-2xl">{p.tagline}</span>
    </div>
  );
}

function UnisonVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-5 p-8 text-lime transition-transform duration-700 group-hover:scale-105">
      <div className="w-[52%]">
        <div className="aspect-[16/10] rounded-lg border-2 border-lime/70 p-2">
          <div className="flex h-3 items-center justify-end gap-1 border-b border-lime/30 pb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            <span className="text-[7px] font-bold">87%</span>
          </div>
          <div className="mt-1.5 space-y-1">
            {["photo_0412.jpg", "notes.pdf", "clip.mov"].map((f, i) => (
              <div key={f} className="flex justify-between rounded bg-lime/10 px-1.5 py-0.5 text-[8px]">
                <span>{f}</span>
                <span>{i === 0 ? "✓" : `${40 + i * 25}%`}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto h-1.5 w-[112%] -translate-x-[5%] rounded-b bg-lime/70" />
      </div>
      <div className="relative flex w-10 items-center">
        <div className="w-full border-t-2 border-dashed border-lime/60" />
        <motion.span
          className="absolute h-2.5 w-2.5 rounded-full bg-lime"
          animate={{ left: ["0%", "90%", "0%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="aspect-[9/19] w-[18%] rounded-xl border-2 border-lime/70 p-1">
        <div className="mx-auto h-0.5 w-4 rounded-full bg-lime/50" />
        <div className="mt-2 grid grid-cols-3 gap-0.5 p-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={cn("aspect-square", [0, 2, 4, 6, 7].includes(i) ? "bg-lime" : "bg-lime/15")} />
          ))}
        </div>
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
