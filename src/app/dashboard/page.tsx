"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Radio,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  ArrowLeft,
  Tv,
  AlertOctagon,
  Network,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  RevealOnScroll,
  StaggerContainer,
  AnimatedCounter,
  HoverGlow,
  PageTransition,
  LoadingPulse,
} from "@/components/motion";
import { cn } from "@/lib/utils";
import {
  buildCategoryBreakdown,
  buildLevelDistribution,
  loadAnalysisHistory,
  type AnalysisRecord,
} from "@/lib/analysis-store";

// Types
interface FeedAlert {
  id: string;
  name: string;
  category: string;
  severity: "Safe" | "Moderate" | "High" | "Critical";
  timestamp: string;
}

const TRENDS_DATA = [
  { day: "Mon", Phishing: 0, UPIfraud: 0, SocEng: 0 },
  { day: "Tue", Phishing: 0, UPIfraud: 0, SocEng: 0 },
  { day: "Wed", Phishing: 0, UPIfraud: 0, SocEng: 0 },
  { day: "Thu", Phishing: 0, UPIfraud: 0, SocEng: 0 },
  { day: "Fri", Phishing: 0, UPIfraud: 0, SocEng: 0 },
  { day: "Sat", Phishing: 0, UPIfraud: 0, SocEng: 0 },
  { day: "Sun", Phishing: 0, UPIfraud: 0, SocEng: 0 },
];

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function historyToFeed(history: AnalysisRecord[]): FeedAlert[] {
  return history.slice(0, 6).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    severity: item.level,
    timestamp: formatRelativeTime(item.timestamp),
  }));
}

function historyToInsights(history: AnalysisRecord[]): string[] {
  if (history.length === 0) {
    return ["Run analyses from the Threat Analyzer to populate live intelligence insights."];
  }

  const latest = history[0]!;
  const criticalCount = history.filter((item) => item.level === "Critical").length;
  const categories = buildCategoryBreakdown(history);

  return [
    `Latest scan "${latest.name}" classified as ${latest.category} with threat score ${latest.score}/100.`,
    `${criticalCount} critical incident${criticalCount === 1 ? "" : "s"} recorded across ${history.length} completed analyses.`,
    categories[0]
      ? `Highest average-risk category in session: ${categories[0].name} (${categories[0].severity}/100).`
      : "Category breakdown will appear after additional scans complete.",
  ];
}

function historyToLeaderboard(history: AnalysisRecord[]) {
  return buildCategoryBreakdown(history).map((entry) => ({
    category: entry.name,
    avgScore: entry.severity,
    volume: `${history.filter((item) => item.category === entry.name).length} scans`,
  }));
}

function historyToSnapshot(history: AnalysisRecord[]) {
  if (history.length === 0) {
    return [
      { label: "Avg Threat Index", value: "—", highlight: false },
      { label: "Confidence Accuracy", value: "—", highlight: false },
      { label: "Most Common Vector", value: "—", highlight: false },
      { label: "Latest Threat Level", value: "—", highlight: false },
    ];
  }

  const latest = history[0]!;
  const avgScore = Math.round(
    history.reduce((sum, item) => sum + item.score, 0) / history.length
  );
  const avgConfidence = Math.round(
    history.reduce((sum, item) => sum + item.confidence, 0) / history.length
  );
  const categories = buildCategoryBreakdown(history);

  return [
    { label: "Avg Threat Index", value: `${avgScore} / 100`, highlight: true },
    { label: "Confidence Accuracy", value: `${avgConfidence}%`, highlight: false },
    {
      label: "Most Common Vector",
      value: categories[0]?.name ?? latest.category,
      highlight: false,
    },
    {
      label: "Latest Threat Level",
      value: latest.level,
      highlight: latest.level === "Critical" || latest.level === "High",
    },
  ];
}

interface CustomDashboardTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    fill?: string;
    name?: string;
    dataKey?: string | number;
    value?: number;
  }>;
  label?: string;
}

// Custom Tooltip component matching dark SOC theme
const CustomDashboardTooltip = ({ active, payload, label }: CustomDashboardTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#080808]/95 p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {label && <p className="text-xs font-semibold text-muted-foreground font-mono mb-1">{label}</p>}
        {payload.map((item, index) => (
          <p key={index} className="text-xs font-mono flex items-center gap-2 mt-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color || item.fill || "#2563EB" }} />
            <span className="text-muted-foreground">{item.name || item.dataKey}:</span>
            <span className="font-bold text-foreground">{item.value} attempts</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ThreatIntelligenceDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const feedAlerts = historyToFeed(history);
  const insightsData = historyToInsights(history);
  const leaderboardData = historyToLeaderboard(history);
  const snapshotData = historyToSnapshot(history);
  const levelDistribution = buildLevelDistribution(history);
  const totalAnalyses = history.length;
  const criticalCount = history.filter((item) => item.level === "Critical").length;
  const avgConfidence =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + item.confidence, 0) / history.length
        )
      : 0;
  const activeInvestigations = history.filter(
    (item) => item.level === "High" || item.level === "Critical"
  ).length;

  useEffect(() => {
    setMounted(true);
    setHistory(loadAnalysisHistory());
  }, []);

  return (
    <PageTransition variant="fade">
      <main className="relative min-h-screen bg-background pb-16">
        
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-2xl">
          <nav className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 md:px-6">
            <Link
              href="/analyze"
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 group-hover:border-white/20 transition-colors">
                <ArrowLeft className="size-4" />
              </span>
              <span className="text-sm font-medium">Return to Analyzer</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg border border-danger/20 bg-danger/10 text-danger animate-pulse">
                <Radio className="size-4" />
              </span>
              <span className="text-xs font-semibold tracking-wider font-mono uppercase text-foreground">
                SOC ACTIVE FEED
              </span>
            </div>
          </nav>
        </header>

        {/* Global Page Glow */}
        <div aria-hidden="true" className="pointer-events-none absolute right-1/4 top-0 size-[450px] rounded-full bg-primary/5 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/4 top-1/2 size-[450px] rounded-full bg-danger/5 blur-[120px]" />

        {/* Page Container */}
        <div className="page-shell mt-6 space-y-6">
          
          {/* Header */}
          <div className="mb-4">
            <RevealOnScroll type="mask" direction="up" duration={0.6}>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Threat Intelligence Dashboard
              </h1>
            </RevealOnScroll>
            <RevealOnScroll type="slide-fade" direction="up" delay={0.1} duration={0.6}>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Real-time command center telemetry, scam DNA vectors, and SOC threat feeds.
              </p>
            </RevealOnScroll>
          </div>

          {/* SECTION 1 — Metric Cards */}
          <StaggerContainer staggerChildren={0.06} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Total Threats Analyzed",
                value: totalAnalyses,
                suffix: "",
                desc: "Completed session analyses",
                color: "text-primary",
              },
              {
                title: "Critical Threats Blocked",
                value: criticalCount,
                suffix: "",
                desc: "Critical severity incidents",
                color: "text-danger animate-pulse",
              },
              {
                title: "Detection Accuracy",
                value: avgConfidence,
                suffix: "%",
                desc: "Average model confidence",
                color: "text-success",
              },
              {
                title: "Active Investigations",
                value: activeInvestigations,
                suffix: "",
                desc: "High or critical open cases",
                color: "text-primary",
              },
            ].map((metric) => (
              <HoverGlow key={metric.title} borderGlow={true}>
                <div className="p-5 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{metric.title}</p>
                  <p className={cn("text-3xl font-bold font-mono tracking-tight", metric.color)}>
                    <AnimatedCounter from={0} to={metric.value} decimals={metric.value % 1 !== 0 ? 1 : 0} suffix={metric.suffix} />
                  </p>
                  <p className="text-[11px] text-muted-foreground">{metric.desc}</p>
                </div>
              </HoverGlow>
            ))}
          </StaggerContainer>

          {/* SECTION 2 — Threat Overview Charts */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Left Card: Threat Trends Line Chart */}
            <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Scam Vector Trends</h2>
                    <p className="text-xs text-muted-foreground">Scam attempt activities compiled over week intervals.</p>
                  </div>
                </div>
                <Badge className="bg-primary/10 border border-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-mono font-medium">
                  WEEKLY RESOLUTION
                </Badge>
              </div>

              <div className="h-[300px] w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={TRENDS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        fontFamily="monospace"
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        fontFamily="monospace"
                      />
                      <Tooltip content={<CustomDashboardTooltip />} />
                      <Line type="monotone" dataKey="Phishing" name="Phishing" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="UPIfraud" name="UPI Fraud" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="SocEng" name="Social Eng." stroke="#6366F1" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <LoadingPulse variant="shimmer" width="100%" height="100%" />
                )}
              </div>
            </div>

            {/* Right Card: Threat Level Distribution Pie Chart */}
            <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                <Layers className="size-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Threat Level Distribution</h2>
                  <p className="text-xs text-muted-foreground">Scans segmented by threat category limits.</p>
                </div>
              </div>

              <div className="h-[230px] w-full flex items-center justify-center">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={levelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {levelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#080808", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "10px", fontFamily: "monospace", color: "#FFF" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <LoadingPulse variant="shimmer" width="100%" height="100%" />
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 font-mono text-[10px] text-center">
                {levelDistribution.map((lvl) => (
                  <div key={lvl.name}>
                    <span className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: lvl.color }} />
                    <span className="text-muted-foreground">{lvl.name}</span>
                    <p className="mt-1 font-bold text-foreground">{lvl.value}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SECTION 3, 4, 5 & 6 — Feed, Leaderboard, Insights, Snapshots */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Left Side: SECTION 3 — Recent Threat Feed */}
            <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <Tv className="size-5 text-danger animate-pulse" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">SOC Alert Monitor Feed</h2>
                    <p className="text-xs text-muted-foreground">Live operations center events telemetry.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-danger animate-ping" />
                  <span className="text-[10px] font-mono text-danger font-semibold uppercase tracking-wider">LIVE REFRESH</span>
                </div>
              </div>

              <div className="space-y-3 min-h-[360px]">
                {feedAlerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No completed analyses yet. Run a scan from the analyzer to populate this feed.
                  </p>
                ) : (
                <AnimatePresence initial={false}>
                  {feedAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: -20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all p-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Flashing severity dot */}
                          <span
                            className={cn(
                              "flex size-2 rounded-full shrink-0",
                              alert.severity === "Critical" && "bg-danger animate-pulse",
                              alert.severity === "High" && "bg-orange-500",
                              alert.severity === "Moderate" && "bg-yellow-500",
                              alert.severity === "Safe" && "bg-success"
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
                              {alert.name}
                            </p>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{alert.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                          <Badge
                            className={cn(
                              "rounded-full px-2 py-0 text-[9px] font-semibold border",
                              alert.severity === "Critical" && "bg-danger/15 text-danger border-danger/25",
                              alert.severity === "High" && "bg-orange-500/15 text-orange-500 border-orange-500/25",
                              alert.severity === "Moderate" && "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
                              alert.severity === "Safe" && "bg-success/15 text-success border-success/25"
                            )}
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                            <Clock className="size-3" />
                            {alert.timestamp}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                )}
              </div>
            </div>

            {/* Right Side: SECTION 4 & 5 — AI Insights, Leaderboards & Snapshots */}
            <div className="space-y-6">
              
              {/* SECTION 4 — AI Threat Insights */}
              <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Sparkles className="size-5 text-yellow-500" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">AI Intelligence Insights</h2>
                    <p className="text-xs text-muted-foreground">Heuristic campaign alerts generated automatically.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {insightsData.map((insight, index) => (
                    <div key={index} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 flex items-start gap-3">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] shrink-0 font-bold mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-xs text-muted-foreground leading-4">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5 — Threat Leaderboard */}
              <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <AlertOctagon className="size-5 text-danger" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Threat Danger Leaderboard</h2>
                    <p className="text-xs text-muted-foreground">Attack classifications ranked by severity score.</p>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {leaderboardData.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Leaderboard data appears after your first completed analysis.
                    </p>
                  ) : (
                  leaderboardData.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between p-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{index + 1}</span>
                        <span className="font-semibold text-foreground">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground text-[10px]">{item.volume}</span>
                        <span className="font-bold text-danger">{item.avgScore} idx</span>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* SECTION 6 — Threat Intelligence Snapshot */}
              <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Network className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Intelligence Snapshot</h2>
                    <p className="text-xs text-muted-foreground">Key intelligence metrics at a glance.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  {snapshotData.map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                      <p className={cn("mt-1.5 font-bold", item.highlight ? "text-danger" : "text-foreground")}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>
    </PageTransition>
  );
}
