"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUpRight, Briefcase } from "lucide-react";
import { profile } from "@/data/site";
import Logo from "./Logo";
import { useLenis } from "./SmoothScroll";

const links = [
  { href: "#top", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience" },
  { href: "#services", label: "Freelance" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const { scrollYProgress } = useScroll();
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(true);
  const lenis = useLenis();
  useMotionValueEvent(scrollYProgress, "change", setProgress);

  // switch the logo colour depending on the section behind it
  useEffect(() => {
    const check = () => {
      const el = document.elementsFromPoint(24, 36).find((e) => !e.closest("header") && !e.closest("[data-nav-skip]"));
      setLight(el?.closest("[data-nav]")?.getAttribute("data-nav") === "light");
    };
    check();
    const t1 = setTimeout(check, 600);
    const t2 = setTimeout(check, 2600); // after the loader lifts
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 mix-blend-normal">
        <div className="flex items-start justify-between px-3 py-3 sm:px-4">
          <a href="#top" aria-label="Venusai Yalamanchili, home" className={`pointer-events-auto text-[17px] transition-colors duration-300 sm:text-[20px] ${open ? "text-ink" : light ? "text-olive" : "text-cream"}`}>
            <Logo />
          </a>
          <div className="pointer-events-auto flex items-center gap-2">
            <a href="#contact" className="btn-lime">
              <Briefcase className="h-3.5 w-3.5" strokeWidth={2.5} /> Hire me
            </a>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid h-[38px] w-[38px] place-items-center rounded-md bg-cream text-ink shadow-[0_2px_12px_rgba(0,0,0,.18)] ring-1 ring-ink/15 transition-transform hover:scale-105"
            >
              <span className="relative block h-3 w-4">
                <span className={`absolute left-0 h-0.5 w-4 bg-current transition-all duration-300 ${open ? "top-[5px] rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-0.5 w-4 bg-current transition-all duration-300 ${open ? "top-[5px] -rotate-45" : "top-[10px]"}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* right-edge scroll indicator */}
      <div aria-hidden className="fixed right-1.5 top-1/2 z-40 hidden h-[34vh] w-[3px] -translate-y-1/2 rounded-full bg-stone/15 md:block">
        <div className="w-full rounded-full bg-stone/70" style={{ height: `${Math.max(8, progress * 100)}%` }} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-2 z-40 flex flex-col justify-between overflow-hidden rounded-2xl bg-lime p-4 pt-20 text-ink sm:p-8 sm:pt-24"
            initial={{ clipPath: "inset(0 0 100% 0 round 16px)" }}
            animate={{ clipPath: "inset(0 0 0% 0 round 16px)" }}
            exit={{ clipPath: "inset(0 0 100% 0 round 16px)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            data-lenis-prevent
          >
            <ul className="flex flex-col">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  className="overflow-hidden"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 font-display text-[13vw] font-black uppercase leading-[0.9] sm:text-[8vw] lg:text-[6.5vw]"
                  >
                    <span className="font-sans text-xs font-semibold tracking-widest opacity-50">0{i + 1}</span>
                    <span className="transition-all duration-500 group-hover:font-serif group-hover:font-normal">{l.label}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <a href={`mailto:${profile.email}`} className="font-serif text-2xl sm:text-4xl">
                {profile.email}
              </a>
              <div className="flex flex-wrap gap-4 font-display text-sm font-extrabold uppercase">
                {profile.socials.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                    {s.label} <ArrowUpRight className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
