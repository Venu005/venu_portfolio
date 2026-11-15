"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Full-screen lime curtain with a counter; lifts once ready. */
export default function Loader() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(100, n + Math.ceil(Math.random() * 8));
      setCount(n);
      if (n >= 100) {
        clearInterval(id);
        setTimeout(() => {
          setDone(true);
          document.documentElement.style.overflow = "";
        }, 300);
      }
    }, 40);
    return () => {
      clearInterval(id);
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          data-nav-skip className="fixed inset-0 z-[100] flex items-end justify-center bg-lime pb-6 text-ink"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[22vw] leading-none sm:text-[14vw]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {count}
          </motion.span>
          <span className="font-display text-xs font-extrabold uppercase tracking-wide">Loading Venusai</span>
          <span className="absolute bottom-0 left-0 h-1 bg-ink" style={{ width: `${count}%`, transition: "width .1s linear" }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
