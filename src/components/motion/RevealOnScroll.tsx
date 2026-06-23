"use client";

import React, { useRef } from "react";
import { motion, useInView, UseInViewOptions } from "framer-motion";
import { EASES, DURATIONS } from "./config";
import { cn } from "@/lib/utils";

export interface RevealOnScrollProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  threshold?: number | "some" | "all";
  margin?: UseInViewOptions["margin"];
  className?: string;
  type?: "slide-fade" | "mask";
}

export const RevealOnScroll = ({
  children,
  direction = "up",
  delay = 0,
  duration = DURATIONS.reveal,
  distance = 32,
  once = true,
  threshold = 0.1,
  margin = "0px 0px -50px 0px",
  className,
  type = "slide-fade",
}: RevealOnScrollProps) => {
  const ref = useRef<HTMLDivElement>(null);
  // Using useInView hook for precise viewport intersection tracking
  const isInView = useInView(ref, {
    once,
    amount: threshold,
    margin,
  });

  const getDirectionOffsets = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { y: 0, x: distance };
      case "right":
        return { y: 0, x: -distance };
      case "none":
      default:
        return { y: 0, x: 0 };
    }
  };

  const offsets = getDirectionOffsets();

  // 1. Mask reveal (classic Stripe heading reveal where text slides up from hidden container)
  if (type === "mask") {
    return (
      <div ref={ref} className={cn("overflow-hidden block", className)}>
        <motion.div
          initial={offsets}
          animate={isInView ? { x: 0, y: 0 } : offsets}
          transition={{
            duration,
            ease: EASES.reveal,
            delay,
          }}
          className="will-change-transform"
        >
          {children}
        </motion.div>
      </div>
    );
  }

  // 2. Slide-fade reveal (standard premium fade up/down)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...offsets }
      }
      transition={{
        duration,
        ease: EASES.linear,
        delay,
      }}
      className={cn("will-change-[opacity,transform]", className)}
    >
      {children}
    </motion.div>
  );
};

export default RevealOnScroll;
