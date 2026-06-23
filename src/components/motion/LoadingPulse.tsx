"use client";

import React from "react";
import { motion, MotionStyle } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LoadingPulseProps {
  className?: string;
  variant?: "pulse" | "shimmer" | "glow";
  width?: string | number;
  height?: string | number;
  radius?: string;
}

export const LoadingPulse = ({
  className,
  variant = "shimmer",
  width,
  height,
  radius = "0.75rem", // Align with design tokens
}: LoadingPulseProps) => {
  const style: MotionStyle = {
    width: width,
    height: height,
    borderRadius: radius,
  };

  // 1. Traditional Opacity Pulse
  if (variant === "pulse") {
    return (
      <motion.div
        style={style}
        className={cn("bg-muted/80 w-full h-4", className)}
        animate={{
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  // 2. Thematic Sentinel Glow Pulse
  if (variant === "glow") {
    return (
      <motion.div
        style={style}
        className={cn(
          "bg-muted/60 border border-primary/10 shadow-[0_0_12px_rgba(37,99,235,0.06)] w-full h-4",
          className
        )}
        animate={{
          opacity: [0.6, 1.0, 0.6],
          borderColor: [
            "rgba(37, 99, 235, 0.08)",
            "rgba(37, 99, 235, 0.24)",
            "rgba(37, 99, 235, 0.08)",
          ],
          boxShadow: [
            "0 0 10px rgba(37,99,235,0.04)",
            "0 0 16px rgba(37,99,235,0.18)",
            "0 0 10px rgba(37,99,235,0.04)",
          ],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  // 3. Premium Diagonal Shimmer Sweep (Default)
  return (
    <div
      style={style as React.CSSProperties}
      className={cn(
        "relative overflow-hidden bg-muted/80 w-full h-4 will-change-transform",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
        style={{
          width: "200%",
          left: "-50%",
        }}
        animate={{
          x: ["-50%", "50%"],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

export default LoadingPulse;
