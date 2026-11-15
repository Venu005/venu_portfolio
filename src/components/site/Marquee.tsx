import { cn } from "@/lib/utils";

type Props = {
  items: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  separator?: React.ReactNode;
  duration?: number;
  reverse?: boolean;
};

/** Infinite horizontal ticker. Content is duplicated so the loop is seamless. */
export default function Marquee({
  items,
  className,
  itemClassName,
  separator = <Star />,
  duration = 30,
  reverse,
}: Props) {
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {items.map((item, i) => (
        <span key={i} className={cn("flex items-center", itemClassName)}>
          {item}
          <span className="mx-6 flex sm:mx-10">{separator}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn("group flex overflow-hidden", className)}>
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
        style={
          {
            "--marquee-duration": `${duration}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {row()}
        {row(true)}
      </div>
    </div>
  );
}

export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-[0.6em] w-[0.6em]", className)} fill="currentColor" aria-hidden>
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
    </svg>
  );
}
