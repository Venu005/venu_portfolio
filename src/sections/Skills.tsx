import Marquee, { Star } from "@/components/site/Marquee";
import { skills } from "@/data/site";

export default function Skills() {
  const rows = Object.entries(skills);
  return (
    <section aria-labelledby="skills-title" className="overflow-hidden bg-olive py-24 sm:py-32">
      <div className="container-x text-center">
        <h2 id="skills-title" className="font-display text-[12vw] font-black uppercase leading-[0.85] text-cream sm:text-[7vw]">
          Tools of the <span className="font-serif font-normal text-leaf">trade</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-cream/70">The stack I reach for when building products end to end.</p>
      </div>
      <div className="mt-14 space-y-2 border-y border-cream/10 py-6 sm:space-y-4">
        {rows.map(([group, items], i) => (
          <Marquee
            key={group}
            reverse={i % 2 === 1}
            duration={30 + i * 6}
            separator={<Star className="text-lime/70" />}
            itemClassName="font-display text-4xl font-black uppercase text-sage sm:text-6xl lg:text-7xl"
            items={[
              <span key="g" className="font-serif text-4xl font-normal normal-case text-lime sm:text-6xl lg:text-7xl">
                {group}
              </span>,
              ...items.map((s) => (
                <span key={s} className="transition-colors hover:text-cream">
                  {s}
                </span>
              )),
            ]}
          />
        ))}
      </div>
    </section>
  );
}
