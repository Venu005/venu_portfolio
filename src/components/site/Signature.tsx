"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Handwritten name that "writes" itself in from left to right. */
export default function Signature({
  text = "Venu",
  className,
  delay = 0,
}: {
  text?: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      aria-hidden
      className={cn("inline-block select-none font-script leading-none", className)}
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1], delay }}
    >
      {text}
    </motion.span>
  );
}
