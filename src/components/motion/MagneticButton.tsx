"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, MotionStyle, HTMLMotionProps } from "framer-motion";
import { SPRINGS } from "./config";
import { cn } from "@/lib/utils";

export interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  range?: number; // Distance (px) at which the magnetic pull activates
  strength?: number; // How strongly the button pulls towards the cursor (0.1 to 1.0)
  contentClassName?: string;
}

export const MagneticButton = ({
  children,
  range = 60,
  strength = 0.35,
  className,
  contentClassName,
  disabled,
  style: customStyle,
  ...props
}: MagneticButtonProps) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Motion values for tracking cursor offset relative to button center
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs to eliminate jitter and follow physics
  const springX = useSpring(x, SPRINGS.magnetic);
  const springY = useSpring(y, SPRINGS.magnetic);

  useEffect(() => {
    // Check if the device has a coarse pointer (touchscreen)
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    setIsMobile(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile || disabled || !containerRef.current) return;

    const { clientX, clientY } = e;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Find the center coordinates of the button
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance between mouse cursor and center
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < range) {
      // Pull strength decreases slightly as we approach the range limit
      const pullFactor = (1 - distance / range) * strength;
      x.set(distanceX * pullFactor);
      y.set(distanceY * pullFactor);
    } else {
      // Return to original position if mouse exits activation range
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center cursor-pointer transition-colors duration-200 outline-none select-none",
        className
      )}
      style={{
        ...customStyle,
        scale: 1,
      } as MotionStyle}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      <motion.span
        className={cn("block w-full h-full", contentClassName)}
        style={{
          x: springX,
          y: springY,
        } as MotionStyle}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

export default MagneticButton;
