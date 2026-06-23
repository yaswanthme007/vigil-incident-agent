"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HoverGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  glowColor?: string; // e.g. "rgba(37, 99, 235, 0.15)"
  glowSize?: number;  // radius in px
  maxOpacity?: number;
  borderGlow?: boolean; // Enable border shimmer/glow
  className?: string;
  containerClassName?: string;
}

export const HoverGlow = ({
  children,
  glowColor = "rgba(37, 99, 235, 0.22)", // Sentinel primary glow default
  glowSize = 300,
  maxOpacity = 1.0,
  borderGlow = true,
  className,
  containerClassName,
  ...props
}: HoverGlowProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mouse coordinate motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  useEffect(() => {
    // Disable hover-track on mobile to optimize performance
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    setIsMobile(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Set cursor position relative to the element
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    animate(opacity, maxOpacity, { duration: 0.2 });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    animate(opacity, 0, { duration: 0.35 });
  };

  // Radial gradient background templates
  const glowTemplate = useMotionTemplate`
    radial-gradient(
      ${glowSize}px circle at ${mouseX}px ${mouseY}px,
      ${glowColor},
      transparent 80%
    )
  `;

  // Standard container glow style (inside the card)
  if (!borderGlow) {
    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn("relative overflow-hidden rounded-3xl", containerClassName)}
        {...props}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none z-0 will-change-[background,opacity]"
          style={{
            background: glowTemplate,
            opacity: opacity,
          }}
        />
        <div className={cn("relative z-10", className)}>
          {children}
        </div>
      </div>
    );
  }

  // Border glow style (Vercel-inspired 1px border highlight)
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-3xl p-[1px] overflow-hidden bg-white/[0.04] transition-all duration-300",
        containerClassName
      )}
      {...props}
    >
      {/* Outer border glow layer (rendered behind the inner content but masked by parent roundings) */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0 will-change-[background,opacity]"
        style={{
          background: glowTemplate,
          opacity: opacity,
        }}
      />
      
      {/* Inner card surface panel */}
      <div
        className={cn(
          "relative z-10 w-full h-full rounded-[calc(var(--radius)-1px)] bg-surface/95 backdrop-blur-sm overflow-hidden",
          className
        )}
      >
        {/* Subtle inner background glow (softened so as not to overpower the border) */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-0 will-change-[background,opacity]"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                ${glowSize * 1.2}px circle at ${mouseX}px ${mouseY}px,
                ${glowColor.replace(/[\d\.]+\)$/, "0.08)")},
                transparent 80%
              )
            `,
            opacity: opacity,
          }}
        />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default HoverGlow;
