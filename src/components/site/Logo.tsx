import { cn } from "@/lib/utils";

/** Stacked wordmark: first name in serif, last name in heavy sans. */
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col leading-[0.82]", className)}>
      <span className="font-serif text-[1.2em] uppercase tracking-tight">Venusai</span>
      <span className="font-display text-[0.86em] font-black uppercase">Yalamanchili</span>
    </span>
  );
}
