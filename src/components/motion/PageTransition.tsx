"use client";

import React from "react";
import { motion } from "framer-motion";
import { EASES, DURATIONS } from "./config";
import { cn } from "@/lib/utils";

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "fade" | "slideUp" | "slideRight" | "scale";
  duration?: number;
  delay?: number;
}

export const PageTransition = ({
  children,
  className,
  variant = "slideUp",
  duration = DURATIONS.default,
  delay = 0,
}: PageTransitionProps) => {
  const transition = {
    duration,
    ease: EASES.linear,
    delay,
  };

  const transitionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition },
      exit: { opacity: 0, transition },
    },
    slideUp: {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0, transition },
      exit: { opacity: 0, y: -16, transition },
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0, transition },
      exit: { opacity: 0, x: 20, transition },
    },
    scale: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1, transition },
      exit: { opacity: 0, scale: 0.98, transition },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={transitionVariants[variant]}
      className={cn("w-full min-h-screen will-change-[opacity,transform]", className)}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
