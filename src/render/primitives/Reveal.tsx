"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Tokens } from "@/lib/schema/tokens";

/**
 * Scroll reveal, driven by the document's motion token.
 *
 * `prefers-reduced-motion` wins unconditionally over whatever the user picked —
 * a site owner cannot opt their visitors out of an accessibility setting.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  motionStyle,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  motionStyle: Tokens["motion"];
}) {
  const reduce = useReducedMotion();

  if (reduce || motionStyle === "none") {
    return <div className={className}>{children}</div>;
  }

  const from =
    motionStyle === "fade" ? { opacity: 0 } : { opacity: 0, y: 16 };

  return (
    <motion.div
      className={className}
      initial={from}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: motionStyle === "stagger" ? delay : 0,
      }}
    >
      {children}
    </motion.div>
  );
}
