"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Fingerprint,
  Gauge,
  Image,
  Link2,
  Radar,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const stats = [
  { label: "Threats Analyzed", value: 1280000, suffix: "+" },
  { label: "Detection Accuracy", value: 99.4, suffix: "%" },
  { label: "Scam Categories", value: 42, suffix: "" },
  { label: "Protection Success Rate", value: 97.8, suffix: "%" },
] as const;

const features = [
  {
    title: "Screenshot Analysis",
    description:
      "Inspect message screenshots, job offers, payment requests, and social posts for deception patterns.",
    icon: Image,
  },
  {
    title: "URL Intelligence",
    description:
      "Decode suspicious domains, redirects, link shorteners, and impersonation signals before a click.",
    icon: Link2,
  },
  {
    title: "Scam DNA",
    description:
      "Map pressure tactics, identity spoofing, incentive traps, and trust signals into a readable profile.",
    icon: Fingerprint,
  },
  {
    title: "Threat Dashboard",
    description:
      "Centralize active risks, review queues, severity trends, and investigation context in one place.",
    icon: Gauge,
  },
  {
    title: "Explainable AI",
    description:
      "Turn model findings into clear evidence, reasoning, and recommended next steps for every case.",
    icon: BrainCircuit,
  },
  {
    title: "Protection Advisor",
    description:
      "Give teams practical guidance on reporting, containment, and user education after every scan.",
    icon: ShieldCheck,
  },
] as const;

const riskBreakdown = [
  { label: "Domain impersonation", value: 92, color: "bg-danger" },
  { label: "Urgency language", value: 84, color: "bg-primary" },
  { label: "Credential harvesting", value: 76, color: "bg-success" },
] as const;

const scamDna = ["Authority spoof", "Reward lure", "Payment redirection"];

export function LandingPage() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <CyberAtmosphere />
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ProductPreviewSection />
      <LandingFooter />
    </main>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-2xl">
      <nav
        aria-label="Primary navigation"
        className="landing-container flex h-16 items-center justify-between"
      >
        <a href="#" className="flex items-center gap-3" aria-label="Sentinel AI home">
          <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-foreground">
            Sentinel AI
          </span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a className="transition hover:text-foreground" href="#statistics">
            Metrics
          </a>
          <a className="transition hover:text-foreground" href="#features">
            Features
          </a>
          <a className="transition hover:text-foreground" href="#preview">
            Preview
          </a>
        </div>

        <Link
          href="/analyze"
          className={cn(buttonVariants({ className: "rounded-full" }))}
        >
          Analyze Threat
          <ArrowRight data-icon="inline-end" />
        </Link>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="landing-container relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-5xl flex-col items-center text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge className="rounded-full border-primary/30 bg-primary/10 px-4 py-1.5 text-primary">
              Scam intelligence for modern security teams
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-balance mt-8 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-normal text-foreground md:text-7xl"
          >
            Understand Scams Before They Understand You
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-xl"
          >
            AI-powered scam intelligence platform that detects phishing, fraud,
            social engineering and malicious links before they become threats.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/analyze"
              className={cn(
                buttonVariants({ size: "lg", className: "rounded-full px-7" })
              )}
            >
              Analyze Threat
              <Radar data-icon="inline-end" />
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "rounded-full border-white/15 bg-white/5 px-7 text-foreground hover:bg-white/10",
                })
              )}
            >
              View Dashboard
              <ArrowRight data-icon="inline-end" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.7, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-6xl"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <RevealSection
      id="statistics"
      className="landing-container py-16 md:py-20"
    >
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="glow-border border-white/10 bg-surface/65 backdrop-blur-xl"
          >
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </RevealSection>
  );
}

function FeaturesSection() {
  return (
    <RevealSection id="features" className="landing-container py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow-label">Threat intelligence toolkit</p>
        <h2 className="text-balance mt-4 text-3xl font-semibold tracking-normal md:text-5xl">
          Built for the messy reality of scams, not just clean lab samples.
        </h2>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="group rounded-2xl border border-white/10 bg-surface/60 p-6 backdrop-blur-xl transition hover:border-primary/45 hover:bg-surface/90 hover:shadow-[0_0_60px_rgba(37,99,235,0.14)]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition group-hover:border-primary/60 group-hover:bg-primary/20">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {feature.description}
              </p>
            </motion.article>
          );
        })}
      </div>
    </RevealSection>
  );
}

function ProductPreviewSection() {
  return (
    <RevealSection id="preview" className="landing-container py-16 md:py-24">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow-label">Product preview</p>
          <h2 className="text-balance mt-4 text-3xl font-semibold tracking-normal md:text-5xl">
            A realistic investigation surface for high-risk messages.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
            Sentinel AI turns suspicious screenshots, messages, and links into
            concise threat evidence your team can review before exposure spreads.
          </p>
        </div>

        <div className="grid gap-4">
          <ThreatScoreCard />
          <div className="grid gap-4 md:grid-cols-2">
            <ScamDnaPreview />
            <RiskBreakdownPreview />
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="landing-container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Sentinel AI</p>
            <p className="text-sm text-muted-foreground">
              Scam intelligence for security teams.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <a href="#features" className="transition hover:text-foreground">
            Features
          </a>
          <a href="#preview" className="transition hover:text-foreground">
            Preview
          </a>
          <a href="#statistics" className="transition hover:text-foreground">
            Metrics
          </a>
        </div>
      </div>
    </footer>
  );
}

function DashboardMockup() {
  return (
    <div className="glow-border relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0c111d]/90 p-3 backdrop-blur-2xl">
      <div className="rounded-[1.1rem] border border-white/8 bg-background/70">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-danger" />
            <span className="size-2.5 rounded-full bg-[#f59e0b]" />
            <span className="size-2.5 rounded-full bg-success" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            scan: wire-transfer-recovery-kit
          </span>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.72fr]">
          <ThreatScoreCard compact />
          <div className="grid gap-4">
            <ScamDnaPreview />
            <RiskBreakdownPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreatScoreCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Threat Score Card</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            Phishing kit detected
          </h3>
        </div>
        <Badge className="rounded-full bg-danger/15 text-danger">Critical</Badge>
      </div>

      <div className="mt-7 flex items-end gap-5">
        <div className="relative flex size-32 items-center justify-center rounded-full border border-danger/35 bg-danger/10 shadow-[0_0_60px_rgba(239,68,68,0.12)]">
          <span className="font-mono text-4xl font-semibold text-foreground">
            91
          </span>
          <span className="absolute bottom-8 text-xs text-danger">/100</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-muted-foreground">
            Mock finding: credential capture page uses fake compliance language,
            new domain registration, and pressure-based payment recovery claims.
          </p>
          {!compact && (
            <div className="mt-5 flex flex-wrap gap-2">
              {["Credential risk", "Brand spoof", "High pressure"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScamDnaPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface/70 p-5">
      <div className="flex items-center gap-3">
        <Fingerprint className="size-5 text-primary" />
        <h3 className="font-semibold text-foreground">Scam DNA Preview</h3>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {scamDna.map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <span className="font-mono text-xs text-primary">
              0{index + 1}
            </span>
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-sm text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskBreakdownPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface/70 p-5">
      <div className="flex items-center gap-3">
        <TerminalSquare className="size-5 text-success" />
        <h3 className="font-semibold text-foreground">Risk Breakdown Preview</h3>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {riskBreakdown.map((risk) => (
          <div key={risk.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{risk.label}</span>
              <span className="font-mono text-foreground">{risk.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className={`h-full rounded-full ${risk.color}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${risk.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CyberAtmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className={`cyber-grid absolute inset-x-[-56px] top-0 h-[780px] opacity-70 ${
          reduceMotion ? "" : "animate-grid-drift"
        }`}
      />
      {[12, 24, 36, 52, 68, 82].map((left, index) => (
        <span
          key={left}
          className={`animate-particle-float absolute size-1.5 rounded-full bg-primary shadow-[0_0_22px_rgba(37,99,235,0.9)] ${
            reduceMotion ? "[animation:none]" : ""
          }`}
          style={{
            left: `${left}%`,
            top: `${120 + index * 58}px`,
            animationDelay: `${index * 0.55}s`,
          }}
        />
      ))}
      <div className="absolute left-1/2 top-20 size-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute right-[-12rem] top-[28rem] size-[420px] rounded-full bg-success/10 blur-[120px]" />
    </div>
  );
}

function RevealSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-120px" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [isInView, value]);

  const formatted =
    value >= 1000
      ? Intl.NumberFormat("en", { notation: "compact" }).format(displayValue)
      : Number.isInteger(value)
        ? Math.round(displayValue).toString()
        : displayValue.toFixed(1);

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}
