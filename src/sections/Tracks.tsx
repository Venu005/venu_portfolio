"use client";
import { ArrowUpRight } from "lucide-react";

const tracks = [
  {
    href: "#experience",
    a: "At",
    b: "Work",
    body: "Client platforms, AI products and the numbers behind them, from Heizen and Kuteeram.",
    tag: "2025 — Now",
  },
  {
    href: "#work",
    a: "After",
    b: "Hours",
    body: "Native apps, MCP servers and hackathon winners I build for the fun of it.",
    tag: "Side projects",
  },
];

/** Two big split links, a nod to the "on track / off track" pair. */
export default function Tracks() {
  return (
    <section className="bg-olive pb-24">
      <div className="grid border-y border-cream/15 md:grid-cols-2">
        {tracks.map((t, i) => (
          <a
            key={t.b}
            href={t.href}
            className={`group relative flex min-h-[46vh] flex-col justify-between overflow-hidden p-5 sm:p-8 ${i === 0 ? "border-b border-cream/15 md:border-b-0 md:border-r" : ""}`}
          >
            <span className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-lime transition-transform duration-700 [transition-timing-function:cubic-bezier(.76,0,.24,1)] group-hover:scale-y-100" />
            <div className="relative flex items-center justify-between text-cream transition-colors duration-500 group-hover:text-ink">
              <span className="eyebrow">{t.tag}</span>
              <ArrowUpRight className="h-7 w-7 transition-transform duration-500 group-hover:rotate-45" />
            </div>
            <div className="relative">
              <h3 className="font-display text-[22vw] font-black uppercase leading-[0.8] text-cream transition-colors duration-500 group-hover:text-ink md:text-[11vw]">
                {t.a}
                <br />
                <span className="font-serif font-normal text-leaf transition-colors duration-500 group-hover:text-ink">{t.b}</span>
              </h3>
              <p className="mt-6 max-w-sm text-cream/70 transition-colors duration-500 group-hover:text-ink/75">{t.body}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
