"use client";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { profile } from "@/data/site";
import { FadeUp } from "@/components/site/Reveal";
import Signature from "@/components/site/Signature";

type Piece = { kind: "stat"; big: string; small: string; caption: string } | { kind: "img"; src: string; caption: string };

const defaultPieces: Piece[] = [
  { kind: "stat", big: "4–6", small: "weeks to ship, vs 8 planned", caption: "ITC Agri, 2026" },
  { kind: "img", src: "/projects/project-3.png", caption: "GDG Hackathon, 2025" },
  { kind: "stat", big: "90%", small: "less manual data collation", caption: "OTIF dashboards, 2026" },
  { kind: "stat", big: "<120ms", small: "API with 2-min LLM jobs queued", caption: "Voice AI, 2025" },
  { kind: "stat", big: "1st", small: "place out of 20+ teams", caption: "GDG Hackathon, 2025" },
  { kind: "stat", big: "800+", small: "problems · LeetCode Knight", caption: "LeetCode, 2025" },
  { kind: "stat", big: "87%", small: "AI review comment accuracy", caption: "Code review bot, 2025" },
  { kind: "stat", big: "8.85", small: "CGPA · B.Tech CSE", caption: "IIITDM Kurnool, 2026" },
];

// positions for scattered pieces (percent of section), and parallax speed
const slots = [
  { top: "2%", left: "3%", speed: -140, rot: -4 },
  { top: "4%", left: "86%", speed: -220, rot: 3 },
  { top: "27%", left: "6%", speed: -260, rot: 3 },
  { top: "30%", left: "83%", speed: -100, rot: -3 },
  { top: "52%", left: "2%", speed: -80, rot: -2 },
  { top: "56%", left: "87%", speed: -300, rot: 4 },
  { top: "80%", left: "5%", speed: -180, rot: 2 },
  { top: "82%", left: "84%", speed: -120, rot: -3 },
];

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const pieces: Piece[] = [...profile.gallery.map((g) => ({ kind: "img" as const, ...g })), ...defaultPieces].slice(0, slots.length);

  return (
    <section id="about" ref={ref} className="relative overflow-hidden bg-olive py-32 sm:py-48">
      {/* scattered pieces (desktop) */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        {pieces.map((p, i) => (
          <Floating key={i} piece={p} slot={slots[i]} progress={scrollYProgress} />
        ))}
      </div>

      <div className="container-x relative">
        <FadeUp className="mb-10 text-center">
          <span className="eyebrow text-cream/70">Software engineer since 2025</span>
        </FadeUp>
        <h2 className="mx-auto max-w-[15ch] text-center font-display text-[11vw] font-black uppercase leading-[0.9] text-cream sm:text-[8vw] lg:max-w-[16ch] lg:text-[5.6vw]">
          <Reveal>
            <span className="accent-up">Building</span> software that ships, turning <span className="accent-up">messy</span> workflows into
            products people <span className="accent-up">love</span>. Full-stack, AI and real-time, from <span className="accent-up">idea</span> to
            production.
          </Reveal>
        </h2>

        {/* mobile: stats as a grid */}
        <div className="mt-16 grid grid-cols-2 gap-3 lg:hidden">
          {pieces
            .filter((p) => p.kind === "stat")
            .slice(0, 6)
            .map((p, i) => (
              <FadeUp key={i} delay={(i % 2) * 0.08}>
                <StatCard piece={p as Extract<Piece, { kind: "stat" }>} />
              </FadeUp>
            ))}
        </div>

        <div className="mx-auto mt-24 grid max-w-4xl gap-12 sm:mt-40 md:grid-cols-2 md:gap-16">
          <FadeUp>
            <p className="font-serif text-4xl leading-[1.05] text-cream sm:text-5xl">
              “Ship it, learn from real users, then ship it <span className="text-lime">better</span>.”
            </p>
            <Signature text="— Venu" className="mt-6 text-5xl text-lime" />
          </FadeUp>
          <FadeUp delay={0.1} className="space-y-5 text-base leading-relaxed text-cream/75 sm:text-lg">
            <p>
              I&apos;m <strong className="text-cream">Venusai Yalamanchili</strong>, a software engineer at{" "}
              <strong className="text-cream">{profile.company}</strong>. I build products for enterprise teams and startups. Recent work
              includes a supply chain platform for ITC Agri&apos;s spices exports, a real-time AI voice interviewer and a GitHub code review bot.
            </p>
            <p>
              I like working close to the people who use what I build. For one platform I spent 20 days on factory floors before designing a
              single screen. After hours I build native apps like <strong className="text-cream">Unison</strong>, experiment with MCP and AI
              agents, and compete on LeetCode.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className="inline"
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  );
}

function Floating({ piece, slot, progress }: { piece: Piece; slot: (typeof slots)[number]; progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [-slot.speed / 2, slot.speed / 2]);
  return (
    <motion.figure
      className="absolute w-[130px] xl:w-[150px]"
      style={{ top: slot.top, left: slot.left, y, rotate: slot.rot }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <figcaption className="eyebrow mb-1.5 text-[9px] text-cream/70">{piece.caption}</figcaption>
      {piece.kind === "img" ? (
        <div className="relative aspect-[4/5] overflow-hidden bg-moss">
          <Image src={piece.src} alt="" fill sizes="170px" className="object-cover" />
        </div>
      ) : (
        <StatCard piece={piece} />
      )}
    </motion.figure>
  );
}

function StatCard({ piece }: { piece: Extract<Piece, { kind: "stat" }> }) {
  return (
    <div className="flex aspect-[4/5] flex-col justify-between bg-moss p-3 text-cream lg:aspect-[4/4.6]">
      <span className="eyebrow text-[9px] text-cream/50 lg:hidden">{piece.caption}</span>
      <span className="font-display text-4xl font-black uppercase leading-none text-lime xl:text-5xl">{piece.big}</span>
      <span className="text-xs leading-snug text-cream/70">{piece.small}</span>
    </div>
  );
}
