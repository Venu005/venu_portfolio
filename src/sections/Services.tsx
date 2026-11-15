"use client";
import { ArrowUpRight } from "lucide-react";
import { process, services } from "@/data/site";
import { FadeUp, Wipe } from "@/components/site/Reveal";

export default function Services() {
  return (
    <section id="services" data-nav="light" className="relative bg-cream text-olive">
      {/* curved top edge */}
      <svg className="absolute -top-px left-0 h-[6vw] w-full text-ink" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
        <path d="M0 0H100V2C70 10 30 10 0 2Z" fill="currentColor" />
      </svg>

      <div className="container-x pb-24 pt-[14vw] sm:pb-32 lg:pt-[10vw]">
        <div className="flex items-center justify-between border-b border-olive/15 pb-4">
          <span className="eyebrow"><Wipe>Freelance</Wipe></span>
          <span className="eyebrow flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full bg-[#7a9a00]" /> Taking new projects
          </span>
        </div>

        <FadeUp>
          <h2 className="mt-10 font-display text-[15vw] font-black uppercase leading-[0.82] sm:text-[10vw]">
            Got an <span className="font-serif font-normal text-[#7a9a00]">idea?</span>
            <br />
            Let&apos;s build <span className="font-serif font-normal text-[#7a9a00]">it.</span>
          </h2>
        </FadeUp>

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <FadeUp className="text-lg leading-relaxed text-olive/75">
            I take on a few freelance projects alongside my full-time role, for founders, agencies and teams that need one engineer who
            owns the whole thing, from database to deploy.
          </FadeUp>
          <FadeUp delay={0.1} className="flex flex-wrap items-start gap-3 md:justify-end">
            <a href="#contact" className="btn-lime">
              Get a quote <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="#work"
              className="inline-flex items-center gap-2 rounded-md border border-olive/30 px-4 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide transition-colors hover:bg-olive hover:text-cream"
            >
              See my work
            </a>
          </FadeUp>
        </div>

        <div className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <FadeUp key={s.title} delay={i * 0.08} y={30}>
              <a href="#contact" className="group block">
                <div className="notch flex aspect-[1/1.1] flex-col justify-between bg-olive p-5 text-cream transition-colors duration-500 group-hover:bg-lime group-hover:text-ink">
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-6xl leading-none text-lime transition-colors group-hover:text-ink">0{i + 1}</span>
                    <ArrowUpRight className="h-6 w-6 transition-transform duration-500 group-hover:rotate-45" />
                  </div>
                  <div className="pb-6">
                    <h3 className="font-display text-3xl font-black uppercase leading-[0.9]">{s.title}</h3>
                    <p className="mt-3 text-sm opacity-75">{s.body}</p>
                  </div>
                </div>
              </a>
            </FadeUp>
          ))}
        </div>

        <div className="mt-24">
          <FadeUp>
            <h3 className="font-display text-5xl font-black uppercase leading-[0.85] sm:text-7xl">
              How we&apos;ll <span className="font-serif font-normal text-[#7a9a00]">work</span>
            </h3>
          </FadeUp>
          <ol className="mt-10 grid border-t border-olive/15 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => (
              <FadeUp key={p.step} delay={i * 0.08} y={20} className="border-b border-olive/15 py-6 sm:pr-8 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0">
                <li className="list-none">
                  <span className="eyebrow text-olive/50">Step {p.step}</span>
                  <h4 className="mt-3 font-display text-3xl font-black uppercase">{p.title}</h4>
                  <p className="mt-2 text-sm text-olive/70">{p.body}</p>
                </li>
              </FadeUp>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
