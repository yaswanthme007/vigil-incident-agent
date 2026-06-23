# Sentinel AI - Motion Design System (Phase 2)

This directory contains the reusable animation infrastructure and motion components for Sentinel AI. The system is designed to provide high-performance, mobile-friendly, premium-tier micro-interactions and transitions inspired by platforms like Linear, Stripe, and Arc Browser.

---

## Motion Architecture

All motion logic is centralized to avoid duplicating animation variants or transition curves across the project. 

```
src/components/motion/
├── config.ts              # Transition curves, springs, and reusable variants
├── index.ts               # Core module exports
├── FadeIn.tsx             # Entry fade component (standard & scroll-triggered)
├── RevealOnScroll.tsx     # Viewport intersection & heading mask transitions
├── StaggerContainer.tsx   # Parent orchestrator for sequential list triggers
├── AnimatedCounter.tsx    # Bypasses React updates for high-performance numbering
├── MagneticButton.tsx     # Physics-based spring pull (disabled on mobile)
├── HoverGlow.tsx          # Card & border-glow mouse-tracking gradients
├── PageTransition.tsx     # Route enter/exit animators
└── LoadingPulse.tsx       # Shimmers and thematic glow loading states
```

---

## 1. Centralized Motion Configuration (`config.ts`)

Defines easing curves, springs, and default durations:
* **EASES.stripe**: Smooth, classic ease-in-out curve.
* **EASES.linear**: Quick snap with a slow, elegant settle (`easeOutExpo`).
* **EASES.arc**: Fluid, high-speed bounce-less transition.
* **SPRINGS.magnetic**: Lightweight, fast spring targeting cursor offsets.
* **SPRINGS.default / snappy / bouncy**: Standard physics states.

---

## 2. Reusable Motion Components

### `FadeIn`
Standard page or section mount animator. Supports:
* Directions: `up`, `down`, `left`, `right`, `none`.
* Custom offsets (`distance`), delay (`delay`), and duration (`duration`).
* Scroll triggering (`viewportTrigger`) with customizable intersection `margin`.

```tsx
import { FadeIn } from "@/components/motion";

<FadeIn direction="up" delay={0.2}>
  <h2>Enterprise-grade scam defense</h2>
</FadeIn>
```

### `RevealOnScroll`
Animate headers or content as they enter the viewport. Supports:
* **`slide-fade`**: Smooth slide and fade transition.
* **`mask`**: Overflow-masked heading reveal. Text slides up from a hidden container (perfect for landing page titles).

```tsx
import { RevealOnScroll } from "@/components/motion";

<RevealOnScroll type="mask" direction="up" duration={0.8}>
  <h1>Threat Intelligence Platform</h1>
</RevealOnScroll>
```

### `StaggerContainer`
Used for grid cells, dashboard stats, or lists. Children like `FadeIn` will cascade their animations.

```tsx
import { StaggerContainer, FadeIn } from "@/components/motion";

<StaggerContainer staggerChildren={0.1}>
  <FadeIn direction="up">First Card</FadeIn>
  <FadeIn direction="up">Second Card</FadeIn>
  <FadeIn direction="up">Third Card</FadeIn>
</StaggerContainer>
```

### `AnimatedCounter`
High-performance digit animator that directly edits the DOM text node, bypassing React re-renders for smooth, 120 FPS counting.
* Supports decimals, prefixes, suffixes, and custom durations.

```tsx
import { AnimatedCounter } from "@/components/motion";

<AnimatedCounter from={0} to={99.8} decimals={1} suffix="%" duration={1.5} />
```

### `MagneticButton`
Physics-driven hover pull button that responds to pointer proximity.
* Automatically disables on touchscreen devices (`pointer: coarse`) for mobile optimization.

```tsx
import { MagneticButton } from "@/components/motion";

<MagneticButton className="px-6 py-3 bg-primary rounded-lg text-white">
  Secure Endpoint Now
</MagneticButton>
```

### `HoverGlow`
Premium glassmorphism background glow and Vercel-inspired 1px border hover shimmer.
* Tracks cursor coordinates dynamically.
* Renders outer glow on border, inner glow on background, or both.

```tsx
import { HoverGlow } from "@/components/motion";

<HoverGlow borderGlow={true} className="p-6">
  <h3>Secure Panel Card</h3>
  <p>Hover to see the 1px border highlight follow your cursor.</p>
</HoverGlow>
```

### `PageTransition`
Wrapper for route layout views. Supports `fade`, `slideUp`, `slideRight`, and `scale`.

```tsx
import { PageTransition } from "@/components/motion";

export default function Page() {
  return (
    <PageTransition variant="slideUp">
      <main>Dashboard Content</main>
    </PageTransition>
  );
}
```

### `LoadingPulse`
Skeletional states matching Sentinel dark theme.
* **`pulse`**: Elegant opacity pulse.
* **`shimmer`**: Diagonal metallic reflection sweep.
* **`glow`**: Thematic blue/primary glowing pulse.

```tsx
import { LoadingPulse } from "@/components/motion";

<LoadingPulse variant="shimmer" width="100%" height="40px" />
```

---

## 3. Performance & Mobile Optimizations

1. **`will-change` utilization**: Applies layout-friendly styling to offload transition scaling onto the GPU.
2. **Coarse pointer bypass**: Magnetic pointer events and hover coordinates are ignored on Touch devices, eliminating latency.
3. **Motion value subscriptions**: `AnimatedCounter` and `HoverGlow` directly stream state updates to DOM element styles and text nodes, keeping React's reconciliation engine idle during animations.
