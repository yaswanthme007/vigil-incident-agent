import { Variants } from "framer-motion";

// Custom easing functions reminiscent of Premium SaaS (Stripe, Linear, Arc)
export const EASES = {
  // Stripe-like smooth entry
  stripe: [0.25, 0.46, 0.45, 0.94],
  // Linear-like quick snap out to slow settle (easeOutExpo)
  linear: [0.16, 1, 0.3, 1],
  // Arc Browser quick fluid animation
  arc: [0.3, 0.8, 0.15, 1],
  // Standard ease-out
  easeOut: [0.25, 0.1, 0.25, 1],
  // Elegant reveal ease (custom cubic-bezier)
  reveal: [0.075, 0.82, 0.165, 1],
} as const;

// Spring configurations for physics-based movements (magnetic buttons, floating cards)
export const SPRINGS = {
  default: { type: "spring", stiffness: 100, damping: 15, mass: 1 },
  bouncy: { type: "spring", stiffness: 300, damping: 15, mass: 0.8 },
  snappy: { type: "spring", stiffness: 220, damping: 22, mass: 0.5 },
  magnetic: { type: "spring", stiffness: 120, damping: 12, mass: 0.1 },
  glow: { type: "spring", stiffness: 80, damping: 25 },
} as const;

// Animation durations in seconds
export const DURATIONS = {
  fast: 0.2,
  default: 0.35,
  slow: 0.6,
  reveal: 0.8,
} as const;

// Reusable Framer Motion variants
export const motionVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: (custom = {}) => ({
      opacity: 1,
      transition: {
        duration: custom.duration || DURATIONS.default,
        ease: custom.ease || EASES.linear,
        delay: custom.delay || 0,
      },
    }),
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 16 },
    visible: (custom = {}) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: custom.duration || DURATIONS.default,
        ease: custom.ease || EASES.linear,
        delay: custom.delay || 0,
      },
    }),
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -16 },
    visible: (custom = {}) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: custom.duration || DURATIONS.default,
        ease: custom.ease || EASES.linear,
        delay: custom.delay || 0,
      },
    }),
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -16 },
    visible: (custom = {}) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: custom.duration || DURATIONS.default,
        ease: custom.ease || EASES.linear,
        delay: custom.delay || 0,
      },
    }),
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 16 },
    visible: (custom = {}) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: custom.duration || DURATIONS.default,
        ease: custom.ease || EASES.linear,
        delay: custom.delay || 0,
      },
    }),
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: (custom = {}) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: custom.duration || DURATIONS.default,
        ease: custom.ease || EASES.linear,
        delay: custom.delay || 0,
      },
    }),
  },
  staggerContainer: {
    hidden: {},
    visible: (custom = {}) => ({
      transition: {
        staggerChildren: custom.staggerChildren || 0.08,
        delayChildren: custom.delayChildren || 0,
      },
    }),
  },
};
