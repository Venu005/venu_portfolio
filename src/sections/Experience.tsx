"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Plus } from "lucide-react";
import { experience } from "@/data/site";
import { FadeUp, Wipe } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";

export default function Experience() {
  const [open, setOpen] = useState(0);
  return (
    <section id="experience" className="bg-olive py-24 sm:py-32">
      <div className="container-x">
        <div className="flex items-center justify-between border-b border-cream/15 pb-4">
          <span className="eyebrow text-cream/60"><Wipe>Experience</Wipe></span>
          <span className="eyebrow text-cream/60">2025 — Now</span>
        </div>
        <FadeUp>
          <h2 className="mt-10 font-display text-[16vw] font-black uppercase leading-[0.82] text-cream sm:text-[10vw]">
            On the <span className="font-serif font-normal text-leaf">clock</span>
          </h2>
        </FadeUp>

        <ul className="mt-12 border-t border-cream/15">
          {experience.map((r, i) => {
            const isOpen = open === i;
            return (
              <li key={r.title} className="border-b border-cream/15">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 py-7 text-left sm:grid-cols-[140px_1fr_1fr_auto] sm:gap-8 sm:py-9"
                >
                  <span className="eyebrow hidden text-cream/50 sm:block">{r.period.split(" — ")[0]}</span>
                  <span>
                    <span className="display block text-4xl text-cream transition-colors group-hover:text-lime sm:text-6xl">{r.company}</span>
                    <span className="mt-2 block text-sm text-cream/50 sm:hidden">{r.period}</span>
                  </span>
                  <span className="hidden font-serif text-3xl text-leaf sm:block">{r.title}</span>
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-full border border-cream/25 transition-all duration-500",
                      isOpen ? "rotate-45 border-lime bg-lime text-ink" : "text-cream group-hover:border-lime"
                    )}
                  >
                    <Plus className="h-5 w-5" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-8 pb-10 sm:grid-cols-[140px_1fr_1fr_44px] sm:gap-8">
                        <div className="hidden sm:block" />
                        <div>
                          <p className="text-cream sm:hidden">{r.title}</p>
                          <p className="font-serif text-3xl leading-tight text-lime">{r.summary}</p>
                          <div className="mt-6 flex flex-wrap gap-2">
                            {r.stack.map((s) => (
                              <span key={s} className="chip border-cream/20 text-cream/80">
                                {s}
                              </span>
                            ))}
                          </div>
                          <p className="eyebrow mt-6 text-cream/50">
                            {r.period} · {r.mode}
                          </p>
                        </div>
                        <ul className="space-y-4 text-cream/75">
                          {r.points.map((p) => (
                            <li key={p} className="flex gap-3 leading-relaxed">
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
