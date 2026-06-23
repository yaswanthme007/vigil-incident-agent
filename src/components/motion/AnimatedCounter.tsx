"use client";

import React, { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number; // in seconds
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  viewportTrigger?: boolean;
  once?: boolean;
}

export const AnimatedCounter = ({
  from = 0,
  to,
  duration = 2.0, // generous duration for smooth, sweeping count-ups
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  viewportTrigger = true,
  once = true,
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: "-50px" });

  const count = useMotionValue(from);

  // Set up spring option for extra responsiveness if desired,
  // but direct animation gives precise duration control.
  useEffect(() => {
    // Determine whether to trigger based on scroll state
    const shouldAnimate = !viewportTrigger || isInView;

    if (shouldAnimate) {
      const controls = animate(count, to, {
        duration,
        ease: "easeOut",
        delay,
      });

      return () => controls.stop();
    }
  }, [isInView, to, from, duration, delay, count, viewportTrigger]);

  // Subscribe to motion value changes for direct DOM updates.
  // This completely bypasses React re-render cycles, ensuring 60+ FPS performance.
  useEffect(() => {
    return count.on("change", (latest) => {
      if (ref.current) {
        const formatted = latest.toFixed(decimals);
        // Add thousands separator commas
        const parts = formatted.split(".");
        parts[0] = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") ?? "";
        const formattedNumber = parts.join(".");
        
        ref.current.textContent = `${prefix}${formattedNumber}${suffix}`;
      }
    });
  }, [count, decimals, prefix, suffix]);

  // Initial text rendering (helpful for SSR/initial load)
  const initialFormatted = from.toFixed(decimals);
  const initialParts = initialFormatted.split(".");
  initialParts[0] = initialParts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") ?? "";
  const initialValue = `${prefix}${initialParts.join(".")}${suffix}`;

  return (
    <span
      ref={ref}
      className={cn("tabular-nums select-none", className)}
    >
      {initialValue}
    </span>
  );
};

export default AnimatedCounter;
