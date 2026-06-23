"use client";

import React from "react";
import { motion, MotionProps, Variants } from "framer-motion";
import { motionVariants } from "./config";
import { cn } from "@/lib/utils";

export interface StaggerContainerProps extends Omit<MotionProps, "children" | "transition"> {
  children: React.ReactNode;
  staggerChildren?: number;
  delayChildren?: number;
  className?: string;
  as?: "div" | "span" | "section" | "article" | "p" | "header" | "footer" | "nav" | "ul" | "li";
  viewportTrigger?: boolean;
  once?: boolean;
  margin?: string;
}

export const StaggerContainer = ({
  children,
  staggerChildren = 0.08,
  delayChildren = 0,
  className,
  as = "div",
  viewportTrigger = true,
  once = true,
  margin = "-20px",
  ...rest
}: StaggerContainerProps) => {
  const Component = (motion[as as keyof typeof motion] || motion.div) as React.ComponentType<
    MotionProps & { className?: string; children?: React.ReactNode }
  >;

  const variants = motionVariants.staggerContainer as Variants;
  const custom = { staggerChildren, delayChildren };

  if (viewportTrigger) {
    return (
      <Component
        {...rest}
        className={cn("will-change-[opacity,transform]", className)}
        variants={variants}
        custom={custom}
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
      custom={custom}
      initial="hidden"
      animate="visible"
    >
      {children}
    </Component>
  );
};

export default StaggerContainer;
