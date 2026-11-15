"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { profile } from "@/data/site";
import Signature from "@/components/site/Signature";

const lineA = "Ship it, learn from real users, then ship it better · ";
const lineB = "I build software people actually use · ";

/**
 * Pinned "message" moment: a greyscale portrait between two giant lines of text that slide in opposite
 * directions, while the signature writes itself across the photo as you scroll.
 */
export default function Message() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const xA = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const xB = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [0.92, 1.04]);

  return (
    <section ref={ref} aria-label="A message from Venu" className="relative h-[260vh] bg-olive">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/topo.svg')] bg-cover bg-center opacity-[0.08] invert" />

        <div className="absolute top-[12vh] z-20 flex flex-col items-center gap-2 text-center">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-lime font-display text-sm font-black text-ink">VY</span>
          <span className="font-display text-[11px] font-extrabold uppercase tracking-wide text-cream">A message from Venu</span>
        </div>

        {/* giant sliding lines */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 select-none">
          <motion.div style={{ x: xA }} className="whitespace-nowrap font-serif text-[15vw] uppercase leading-[0.9] text-leaf sm:text-[10vw]">
            {lineA.repeat(4)}
          </motion.div>
          <motion.div style={{ x: xB }} className="whitespace-nowrap font-display text-[15vw] font-black uppercase leading-[0.9] text-cream sm:text-[10vw]">
            {lineB.repeat(5)}
          </motion.div>
        </div>

        {/* greyscale portrait */}
        <motion.div style={{ scale: photoScale }} className="relative z-10 aspect-[4/3] w-[78vw] max-w-[620px] overflow-hidden bg-moss sm:w-[44vw]">
          <Image src={profile.photo} alt="" fill sizes="(min-width:640px) 44vw, 78vw" className="object-cover object-[50%_30%] grayscale" />
          <div className="absolute inset-0 bg-olive/40 mix-blend-multiply" />
        </motion.div>

        {/* the signature writes itself as you scroll */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-[96vw] max-w-[1100px] -rotate-[4deg] text-lime drop-shadow-[0_8px_30px_rgba(0,0,0,.35)] sm:w-[70vw]">
            <Signature mode="scroll" progress={scrollYProgress} range={[0.12, 0.72]} />
          </div>
        </div>
      </div>
    </section>
  );
}
