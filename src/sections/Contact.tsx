"use client";
import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { profile } from "@/data/site";
import { FadeUp } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";

const types = ["Web app", "AI / LLM feature", "Backend / API", "MVP", "Something else"];

/** Project brief form. It composes an email in the visitor's mail app, so there's no backend to maintain. */
export default function Contact() {
  const [type, setType] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const toggle = (t: string) => setType((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "");
    const subject = `Project enquiry${name ? ` from ${name}` : ""}`;
    const body = [
      `Hi Venu,`,
      ``,
      String(f.get("message") || ""),
      ``,
      `Project type: ${type.join(", ") || "-"}`,
      `Name: ${name}`,
      `Company: ${String(f.get("company") || "-")}`,
    ].join("\n");
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section id="contact" className="bg-olive pb-24 pt-24 sm:pt-32">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <FadeUp>
            <span className="eyebrow text-cream/60">Contact</span>
            <h2 className="mt-6 font-display text-[19vw] font-black uppercase leading-[0.8] text-cream sm:text-[12vw] lg:text-[8.5vw]">
              Let&apos;s
              <br />
              <span className="font-serif font-normal text-leaf">talk.</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1} className="mt-8 max-w-md space-y-6 text-cream/75">
            <p>Tell me what you&apos;re building. I usually reply within 24 hours with questions, and a rough plan.</p>
            <div className="flex flex-wrap items-center gap-3">
              <a href={`mailto:${profile.email}`} className="break-all font-serif text-2xl text-cream underline decoration-lime decoration-2 underline-offset-4 sm:text-3xl">
                {profile.email}
              </a>
              <button onClick={copy} className="grid h-9 w-9 place-items-center rounded-md bg-cream/10 text-cream transition-colors hover:bg-lime hover:text-ink" aria-label="Copy email address">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-cream/20 px-3 py-2 font-display text-xs font-extrabold uppercase text-cream transition-colors hover:border-lime hover:text-lime"
                >
                  {s.label} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ))}
              <a
                href={profile.resume}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-cream/20 px-3 py-2 font-display text-xs font-extrabold uppercase text-cream transition-colors hover:border-lime hover:text-lime"
              >
                Resume <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.15}>
          <form onSubmit={submit} className="space-y-8 rounded-3xl bg-moss/60 p-5 sm:p-8">
            <fieldset>
              <legend className="eyebrow mb-3 text-cream/60">What do you need?</legend>
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <Pill key={t} active={type.includes(t)} onClick={() => toggle(t)}>
                    {t}
                  </Pill>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field name="name" label="Your name" required />
              <Field name="company" label="Company (optional)" />
            </div>
            <Field name="message" label="Tell me about the project" textarea required />
            <button type="submit" className="btn-lime w-full justify-center py-4 text-base">
              Send enquiry <ArrowUpRight className="h-4 w-4" />
            </button>
            <p className="text-center text-xs text-cream/50">This opens your email app with the details filled in.</p>
          </form>
        </FadeUp>
      </div>
    </section>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        active ? "border-lime bg-lime text-ink" : "border-cream/20 text-cream/80 hover:border-cream/50"
      )}
    >
      {children}
    </button>
  );
}

function Field({ name, label, textarea, required }: { name: string; label: string; textarea?: boolean; required?: boolean }) {
  const cls =
    "peer w-full border-b border-cream/25 bg-transparent pb-2 pt-1 text-lg text-cream outline-none transition-colors placeholder:text-transparent focus:border-lime";
  return (
    <label className="block">
      <span className="eyebrow mb-2 block text-cream/60">{label}</span>
      {textarea ? <textarea name={name} required={required} rows={4} className={cn(cls, "resize-none")} /> : <input name={name} required={required} className={cls} />}
    </label>
  );
}
