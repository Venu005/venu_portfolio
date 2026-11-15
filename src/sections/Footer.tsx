"use client";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { profile, skills } from "@/data/site";
import Marquee from "@/components/site/Marquee";
import Signature from "@/components/site/Signature";

const pages = [
  { href: "#top", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience" },
  { href: "#services", label: "Freelance" },
];

function useIstClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date());
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function Footer() {
  const time = useIstClock();
  const year = new Date().getFullYear();
  const tech = [...skills["AI / LLM"].slice(0, 4), ...skills.Frameworks.slice(0, 4), ...skills.Cloud.slice(0, 3)];

  return (
    <footer className="relative bg-olive">
      <svg className="absolute -top-px left-0 z-10 h-[5vw] w-full text-olive" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
        <path d="M0 0H100V2C70 10 30 10 0 2Z" fill="currentColor" />
      </svg>
      <div data-nav="light" className="bg-[linear-gradient(to_bottom,#f4f4ed_0%,#e8f7a0_35%,#d2ff00_70%)] px-2 pb-2 pt-[16vh]">
        <div className="relative">
          {/* tab notch on top centre */}
          <svg className="absolute -top-[23px] left-1/2 h-6 w-[220px] -translate-x-1/2 text-olive sm:w-[260px]" viewBox="0 0 260 24" preserveAspectRatio="none" aria-hidden>
            <path d="M0 24C30 24 36 0 70 0H190C224 0 230 24 260 24Z" fill="currentColor" />
          </svg>

          <div data-nav="dark" className="relative overflow-hidden rounded-[20px] bg-olive px-4 pb-6 pt-16 text-cream sm:px-8 sm:pt-20">
            {/* topographic lines */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(ellipse at 18% 30%, transparent 0 26px, rgba(210,255,0,.07) 27px 28px), repeating-radial-gradient(ellipse at 85% 75%, transparent 0 30px, rgba(210,255,0,.06) 31px 32px)",
              }}
            />

            <div className="relative text-center">
              <div className="mx-auto mb-6 w-40 text-lime sm:w-52">
                <Signature strokeWidth={6} />
              </div>
              <h2 className="font-display text-[13vw] font-black uppercase leading-[0.82] sm:text-[8vw] lg:text-[6.4vw]">
                Always <span className="font-serif font-normal text-leaf">shipping</span>
                <br />
                the <span className="font-serif font-normal text-leaf">good stuff</span>.
              </h2>
            </div>

            <div className="relative mt-14 grid grid-cols-2 gap-10 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="text-center">
                <span className="eyebrow text-[10px] text-cream/50">Pages</span>
                <ul className="mt-3 space-y-0.5 font-display text-lg font-black uppercase sm:text-xl">
                  {pages.map((p) => (
                    <li key={p.href}>
                      <a href={p.href} className="transition-colors hover:text-lime">
                        {p.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#contact" className="text-lime">
                      Hire me
                    </a>
                  </li>
                </ul>
              </div>

              <div className="col-span-2 row-start-1 flex flex-col items-center gap-4 sm:col-span-1 sm:row-start-auto">
                <a
                  href={`mailto:${profile.email}`}
                  className="grid h-40 w-40 place-items-center rounded-full bg-lime text-center font-display text-xl font-black uppercase leading-none text-ink transition-transform duration-500 hover:rotate-6 hover:scale-105 sm:h-48 sm:w-48"
                >
                  <span>
                    Start a
                    <br />
                    <span className="font-serif text-3xl font-normal normal-case">project</span>
                    <ArrowUpRight className="mx-auto mt-1 h-6 w-6" />
                  </span>
                </a>
                <span className="flex items-center gap-2 text-xs text-cream/60">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-lime" /> {time ? `${time} IST` : "IST"} · Hyderabad, India
                </span>
              </div>

              <div className="text-center">
                <span className="eyebrow text-[10px] text-cream/50">Follow on</span>
                <ul className="mt-3 space-y-0.5 font-display text-lg font-black uppercase sm:text-xl">
                  {profile.socials.map((s) => (
                    <li key={s.href}>
                      <a href={s.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-lime">
                        {s.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href={profile.resume} target="_blank" rel="noreferrer" className="transition-colors hover:text-lime">
                      Resume
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative mt-14 border-t border-cream/10 pt-5">
              <Marquee
                duration={40}
                separator={<span className="text-lime">/</span>}
                itemClassName="font-display text-sm font-extrabold uppercase text-sage"
                items={tech.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-2 font-display text-[11px] font-extrabold uppercase text-ink">
          <span>© {year} Venusai Yalamanchili. All rights reserved</span>
          <a href="#top" className="inline-flex items-center gap-1">
            Back to top <ArrowUp className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
