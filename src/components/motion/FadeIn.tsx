"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";
import { EASES, DURATIONS } from "./config";
import { cn } from "@/lib/utils";

export interface FadeInProps extends Omit<MotionProps, "children" | "transition"> {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  as?: "div" | "span" | "section" | "article" | "p" | "header" | "footer" | "nav" | "ul" | "li";
  viewportTrigger?: boolean;
  once?: boolean;
  margin?: string;
}

export const FadeIn = ({
  children,
  direction = "up",
  delay = 0,
  duration = DURATIONS.default,
  distance = 16,
  className,
  as = "div",
  viewportTrigger = false,
  once = true,
  margin = "-20px",
  ...rest
}: FadeInProps) => {
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

  const variants = {
    hidden: {
      opacity: 0,
      ...offsets,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: EASES.linear,
        delay,
      },
    },
  };

  const Component = (motion[as as keyof typeof motion] || motion.div) as React.ComponentType<
    MotionProps & { className?: string; children?: React.ReactNode }
  >;

  if (viewportTrigger) {
    return (
      <Component
        {...rest}
        className={cn("will-change-[opacity,transform]", className)}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin }}
      >
        {children}
      </Component>
    );
  }


  return (
    <Component
      {...rest}
      className={cn("will-change-[opacity,transform]", className)}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </Component>
  );
};

export default FadeIn;
