"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  ShieldAlert,
  BrainCircuit,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Copy,
  Check,
  Activity,
  Fingerprint,
  TerminalSquare,
  Sparkles,
  Globe,
  Layers,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  FadeIn,
  RevealOnScroll,
  StaggerContainer,
  AnimatedCounter,
  HoverGlow,
  PageTransition,
  LoadingPulse,
  EASES,
} from "@/components/motion";
import { cn } from "@/lib/utils";
import { ThreatAnalysisResponse } from "@/types";
import {
  buildCategoryBreakdown,
  buildTimelineFromHistory,
  formatRiskLabel,
  loadAnalysisHistory,
  type AnalysisRecord,
} from "@/lib/analysis-store";


// Types
interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  forensicProof: string;
  riskRating: "Low" | "Medium" | "High" | "Critical";
}

interface RelatedThreat {
  id: string;
  name: string;
  score: number;
  level: "Safe" | "Moderate" | "High" | "Critical";
  category: string;
  date: string;
}

interface ConfidenceBarItem {
  name: string;
  score: number;
}

interface TimelineItem {
  time: string;
  threats: number;
  blocks: number;
}

interface CategoryBarItem {
  name: string;
  severity: number;
}

// Recharts palette helpers
interface CompositionItem {
  name: string;
  value: number;
  color: string;
}

const COMPOSITION_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#6366F1",
  "#EC4899",
  "#10B981",
  "#3B82F6",
] as const;

interface CustomChartTooltipProps {
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

// Custom Tooltip component matching Sentinel Dark Cybersecurity Aesthetic
const CustomChartTooltip = ({ active, payload, label }: CustomChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#080808]/95 p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {label && <p className="text-xs font-semibold text-muted-foreground font-mono mb-1">{label}</p>}
        {payload.map((item, index) => (
          <p key={index} className="text-xs font-mono flex items-center gap-2 mt-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color || item.fill || "#2563EB" }} />
            <span className="text-muted-foreground">{item.name || item.dataKey}:</span>
            <span className="font-bold text-foreground">{item.value}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ThreatIntelligenceResultsPage() {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasLiveData, setHasLiveData] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [mitigationsCompleted, setMitigationsCompleted] = useState<Record<string, boolean>>({});

  const [reportId, setReportId] = useState("SN-PENDING");
  const [threatScore, setThreatScore] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [threatLevel, setThreatLevel] = useState("Unknown");
  const [scamCategory, setScamCategory] = useState("Awaiting Analysis");
  const [analysisSource, setAnalysisSource] = useState<string | null>(null);
  const [ocrSource, setOcrSource] = useState<string | null>(null);
  
  const [evidenceData, setEvidenceData] = useState<EvidenceItem[]>([]);
  const [scamDnaData, setScamDnaData] = useState<{ subject: string; value: number }[]>([]);
  const [compositionData, setCompositionData] = useState<CompositionItem[]>([]);
  const [confidenceData, setConfidenceData] = useState<ConfidenceBarItem[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBarItem[]>([]);
  const [relatedThreats, setRelatedThreats] = useState<RelatedThreat[]>([]);
  
  interface PlanItem {
    id: string;
    title: string;
    description: string;
  }
  const [protectionPlan, setProtectionPlan] = useState<PlanItem[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  // Prevent SSR Hydration mismatches by delaying chart mounting
  useEffect(() => {
    setMounted(true);

    try {
      const rawResult = sessionStorage.getItem("sentinel_analysis_result");
      if (!rawResult) {
        return;
      }

      const result = JSON.parse(rawResult) as ThreatAnalysisResponse;
      const history = loadAnalysisHistory();
      setHasLiveData(true);
        
        // Generate random report ID
        const randomId = `SN-${Math.floor(10000 + Math.random() * 90000)}-CLASSIFIED`;
        setReportId(randomId);
        setThreatScore(result.threat_score);
        setConfidenceScore(result.confidence);
        setThreatLevel(result.threat_level);
        setScamCategory(result.category);
        setOcrConfidence(result.ocr_confidence ?? null);
        setExtractedText(result.extracted_text ?? null);
        setAnalysisSource(result.analysis_source ?? null);
        setOcrSource(result.ocr_source ?? null);

        // Map Red Flags to Evidence Items
        const mappedEvidence: EvidenceItem[] = (result.red_flags || []).map((flag, idx) => ({
          id: `ev-${idx}`,
          title: flag,
          description: `Pattern match detected: ${flag}. This marker matches signature database heuristics at a high confidence interval.`,
          forensicProof: result.extracted_text
            ? `Extracted text snippet containing threat marker context: "${result.extracted_text.slice(0, 150)}..."`
            : `Cognitive indicator identified: ${flag} within the analysis scope.`,
          riskRating: result.threat_score >= 85 ? "Critical" : result.threat_score >= 65 ? "High" : result.threat_score >= 35 ? "Medium" : "Low",
        }));

        if (mappedEvidence.length === 0) {
          mappedEvidence.push({
            id: "ev-default",
            title: "No specific threat flags detected",
            description: "The analysis engine completed heuristic checks and found zero explicit compromise indicators.",
            forensicProof: "Zero high-risk keyword occurrences or visual spoofing signals matched.",
            riskRating: "Low"
          });
        }
        setEvidenceData(mappedEvidence);
        setExpandedEvidence(mappedEvidence[0]?.id || null);

        // Map Scam DNA Radar data
        const ratingToScore = (rating: string | number): number => {
          if (typeof rating === "number") return rating;
          const r = String(rating).toLowerCase();
          if (r.includes("crit")) return 95;
          if (r.includes("high")) return 80;
          if (r.includes("med")) return 55;
          if (r.includes("low")) return 30;
          return 10;
        };

        const mappedDna = Object.entries(result.scam_dna || {}).map(([key, val]) => ({
          subject: key,
          value: ratingToScore(val),
        }));
        if (mappedDna.length > 0) {
          setScamDnaData(mappedDna);
        }

        // Map Threat Composition Pie Chart data
        const mappedComposition: CompositionItem[] = Object.entries(
          result.risk_breakdown || {}
        ).map(([key, val], idx) => ({
          name: key,
          value: typeof val === "number" ? val : parseInt(String(val)) || 0,
          color:
            COMPOSITION_COLORS[idx % COMPOSITION_COLORS.length] ??
            COMPOSITION_COLORS[0],
        }));
        if (mappedComposition.length > 0) {
          setCompositionData(mappedComposition);
        }

        const mappedConfidence: ConfidenceBarItem[] = Object.entries(
          result.risk_breakdown || {}
        ).map(([key, val]) => ({
          name: formatRiskLabel(key),
          score: typeof val === "number" ? val : parseInt(String(val)) || 0,
        }));
        if (mappedConfidence.length > 0) {
          setConfidenceData(mappedConfidence);
        }

        const sessionTimeline = buildTimelineFromHistory(history);
        setTimelineData(
          sessionTimeline.length > 0
            ? sessionTimeline
            : [
                {
                  time: "Now",
                  threats: result.threat_score,
                  blocks:
                    result.threat_level === "Safe"
                      ? Math.max(0, result.threat_score - 20)
                      : result.threat_score,
                },
              ]
        );

        const sessionCategories = buildCategoryBreakdown(history);
        setCategoryData(
          sessionCategories.length > 0
            ? sessionCategories
            : [{ name: result.category, severity: result.threat_score }]
        );

        const related = history.slice(1, 4).map((item: AnalysisRecord) => ({
          id: item.id,
          name: item.name,
          score: item.score,
          level: item.level,
          category: item.category,
          date: item.date,
        }));
        setRelatedThreats(related);

        // Map Protection Plan Actions
        const mappedPlan = (result.protection_plan || []).map((step, idx) => ({
          id: `action-${idx}`,
          title: step,
          description: `Remediation procedure: ${step}`,
        }));
        setProtectionPlan(mappedPlan);

        const initialCompleted: Record<string, boolean> = {};
        mappedPlan.forEach((action) => {
          initialCompleted[action.id] = false;
        });
        setMitigationsCompleted(initialCompleted);
    } catch (err) {
      console.error("Error loading analysis results from session storage:", err);
    }
  }, []);

  const handleCopyReport = () => {
    setCopied(true);
    navigator.clipboard.writeText(`Sentinel Report ID: ${reportId} - Score: ${threatScore}/100`);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => (prev === id ? null : id));
  };

  const toggleMitigation = (id: string) => {
    setMitigationsCompleted((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <PageTransition variant="fade">
      <main className="relative min-h-screen bg-background pb-20">
        
        {/* Navigation Breadcrumb */}
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

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">{reportId}</span>
              <button
                onClick={handleCopyReport}
                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground transition-all hover:bg-white/[0.08]"
                title="Copy forensic summary hash"
              >
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </nav>
        </header>

        {/* Global Page Glow */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 rounded-full bg-danger/10 blur-[120px]" />

        {/* Page Container */}
        <div className="page-shell mt-6">
          {!hasLiveData && (
            <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-sm text-yellow-100">
              No live analysis report found. Run a scan from the analyzer to populate this page.
              <Link href="/analyze" className="ml-2 underline text-yellow-50">
                Go to Analyzer
              </Link>
            </div>
          )}

          {analysisSource === "fallback" && (
            <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-xs text-yellow-100">
              Gemini AI is unavailable or failed for this report. Results were generated using heuristic fallback logic.
            </div>
          )}

          {ocrSource === "fallback" && extractedText && (
            <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-xs text-yellow-100">
              Tesseract OCR is unavailable. Screenshot text was generated using fallback extraction.
            </div>
          )}
          
          {/* Main Incidents Details Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Left Side: Summary, Gauges, Forensics */}
            <div className="space-y-6">
              
              {/* SECTION 1 & 2: Threat Summary & Gauge */}
              <HoverGlow borderGlow={true} containerClassName="w-full">
                <div className="p-6 md:p-8 space-y-6">
                  
                  {/* Title Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                    <div>
                      <Badge className="bg-danger/15 text-danger border border-danger/25 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wide">
                        Verified Threat Incident
                      </Badge>
                      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        Forensic Intelligence Report
                      </h1>
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        Classification: RESTRICTED SECURE MATRIX
                      </p>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="rounded-lg bg-white/5 border border-white/5 p-3 text-center min-w-[90px]">
                        <p className="text-[10px] text-muted-foreground uppercase">Confidence</p>
                        <p className="mt-1.5 text-lg font-bold text-foreground">{confidenceScore}%</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/5 p-3 text-center min-w-[90px]">
                        <p className="text-[10px] text-muted-foreground uppercase">Category</p>
                        <p className="mt-1.5 text-xs font-bold text-primary truncate max-w-[100px]" title={scamCategory}>
                          {scamCategory}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Details */}
                  <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] items-center">
                    
                    {/* Gauge Circle */}
                    <div className="flex justify-center py-2">
                      <div className="relative flex size-44 items-center justify-center rounded-full border border-white/5 bg-[#080808] shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)]">
                        <div className="absolute inset-4 rounded-full bg-danger/15 blur-lg animate-pulse" />
                        
                        {/* Interactive Circle Progress Arc */}
                        <svg className="absolute inset-0 size-full -rotate-90">
                          <circle
                            cx="88"
                            cy="88"
                            r="78"
                            className="stroke-white/5"
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="88"
                            cy="88"
                            r="78"
                            className="stroke-danger"
                            strokeWidth="7"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 78}
                            initial={{ strokeDashoffset: 2 * Math.PI * 78 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 78 - (threatScore / 100) * (2 * Math.PI * 78) }}
                            transition={{ duration: 1.8, ease: EASES.linear }}
                            strokeLinecap="round"
                          />
                        </svg>

                        <div className="text-center z-10">
                          <span className="font-mono text-5xl font-black tracking-tighter text-foreground">
                            <AnimatedCounter from={0} to={threatScore} duration={1.8} />
                          </span>
                          <span className="absolute bottom-11 left-1/2 -translate-x-1/2 text-xs text-danger font-mono font-semibold uppercase tracking-wider">
                            /100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Threat Details Listing */}
                    <div className="space-y-4">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3 font-mono text-xs">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-muted-foreground">Threat Score:</span>
                          <span className="text-danger font-bold">{threatScore}/100</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-muted-foreground">Severity Level:</span>
                          <span className="text-danger font-bold uppercase tracking-wider">{threatLevel}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-muted-foreground">Confidence Score:</span>
                          <span className="text-foreground font-semibold">{confidenceScore}% ACCURACY</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Attack Category:</span>
                          <span className="text-primary font-semibold">{scamCategory}</span>
                        </div>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground pl-1">
                        {extractedText ? (
                          `Heuristic OCR analysis parsed extracted screenshot text with threat score ${threatScore}/100. Key indicators include: ${evidenceData.map(e => e.title).join(", ")}.`
                        ) : (
                          `Heuristic checks completed for this incident. Detected ${scamCategory} with a threat level of ${threatLevel}. Immediate security precautions are advised.`
                        )}
                      </p>
                    </div>

                  </div>

                </div>
              </HoverGlow>

              {extractedText && (
                <HoverGlow borderGlow={true} containerClassName="w-full">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <TerminalSquare className="size-5 text-primary" />
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Extracted Screenshot Text</h2>
                        <p className="text-[11px] text-muted-foreground">Captured via Tesseract OCR ({ocrConfidence}% confidence)</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/40 border border-white/5 p-4 font-mono text-xs text-primary/90 break-words max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {extractedText}
                    </div>
                  </div>
                </HoverGlow>
              )}

              {/* SECTION 4 — Explainable AI */}
              <div className="space-y-4">
                <RevealOnScroll type="slide-fade" direction="up" duration={0.5}>
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Explainable AI Evidence</h2>
                  </div>
                  <p className="text-xs text-muted-foreground pl-7">Forensic checklist detailing model classifications and logic signatures.</p>
                </RevealOnScroll>

                <div className="space-y-3">
                  {evidenceData.map((item, index) => {
                    const isOpen = expandedEvidence === item.id;
                    return (
                      <HoverGlow
                        key={item.id}
                        borderGlow={true}
                        containerClassName="transition-all duration-300"
                      >
                        <div className="p-4">
                          <button
                            onClick={() => toggleEvidence(item.id)}
                            className="flex w-full items-center justify-between text-left outline-none"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-primary/80">0{index + 1}</span>
                              <div>
                                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[250px] sm:max-w-md">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                className={cn(
                                  "text-[10px] px-2 py-0 rounded font-mono uppercase",
                                  item.riskRating === "Critical" && "bg-danger/15 text-danger border-danger/10",
                                  item.riskRating === "High" && "bg-orange-500/15 text-orange-500 border-orange-500/10",
                                  item.riskRating === "Medium" && "bg-yellow-500/15 text-yellow-500 border-yellow-500/10",
                                  item.riskRating === "Low" && "bg-success/15 text-success border-success/10"
                                )}
                              >
                                {item.riskRating}
                              </Badge>
                              {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: EASES.linear }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                  <p className="text-xs text-muted-foreground leading-5">{item.description}</p>
                                  <div className="rounded-lg bg-black/40 border border-white/5 p-3 font-mono text-[11px] text-primary/95 break-all">
                                    <span className="text-muted-foreground text-[10px] block uppercase mb-1">Forensic Evidence Dump:</span>
                                    {item.forensicProof}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </HoverGlow>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4 — Threat Activity Timeline */}
              <div className="rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Radio className="size-5 text-primary animate-pulse" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Global Threat Activity</h2>
                    <p className="text-xs text-muted-foreground">Scam distribution telemetry logs (last 24 hours).</p>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                          dataKey="time"
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
                        <Tooltip content={<CustomChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="threats"
                          name="Scans Run"
                          stroke="#EF4444"
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1, fill: "#EF4444" }}
                          activeDot={{ r: 5, strokeWidth: 0, fill: "#EF4444" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="blocks"
                          name="Quarantined"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1, fill: "#10B981" }}
                          activeDot={{ r: 5, strokeWidth: 0, fill: "#10B981" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <LoadingPulse variant="shimmer" width="100%" height="100%" />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3 — Confidence Breakdown Bar Chart */}
              <div className="rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Activity className="size-5 text-success" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">AI Engine Model Confidence</h2>
                    <p className="text-xs text-muted-foreground">Confidence limits per intelligence vector module.</p>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={confidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.3)"
                          fontSize={9}
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
                          domain={[0, 100]}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="score" name="Accuracy Index" radius={[4, 4, 0, 0]}>
                          {confidenceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#2563EB" : "#3B82F6"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <LoadingPulse variant="shimmer" width="100%" height="100%" />
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Side: Scam DNA Radar, Threat Composition, Category Distribution, Protections */}
            <div className="space-y-6">
              
              {/* SECTION 1 — Scam DNA Radar Chart */}
              <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Fingerprint className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Scam DNA Fingerprint</h2>
                    <p className="text-xs text-muted-foreground">Radar projection of cognitive engineering elements.</p>
                  </div>
                </div>

                <div className="h-[280px] w-full flex items-center justify-center">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={scamDnaData}>
                        <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          stroke="rgba(255, 255, 255, 0.4)"
                          fontSize={9}
                          fontFamily="monospace"
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          stroke="rgba(255, 255, 255, 0.1)"
                          fontSize={8}
                          fontFamily="monospace"
                        />
                        <Radar
                          name="DNA Index"
                          dataKey="value"
                          stroke="#2563EB"
                          fill="#2563EB"
                          fillOpacity={0.25}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <LoadingPulse variant="shimmer" width="100%" height="100%" />
                  )}
                </div>
              </div>

              {/* SECTION 2 — Threat Composition Pie Chart */}
              <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Layers className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Threat Composition Vector</h2>
                    <p className="text-xs text-muted-foreground">Percentage footprint of threat severity indices.</p>
                  </div>
                </div>

                <div className="h-[250px] w-full flex items-center justify-center">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={compositionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          animationDuration={1200}
                        >
                          {compositionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconSize={8}
                          iconType="circle"
                          wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", color: "#94A3B8" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <LoadingPulse variant="shimmer" width="100%" height="100%" />
                  )}
                </div>
              </div>

              {/* SECTION 5 — Category Distribution */}
              <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Sparkles className="size-5 text-yellow-500" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Global Category Severity</h2>
                    <p className="text-xs text-muted-foreground">Frequencies sorted by average threat index.</p>
                  </div>
                </div>

                <div className="h-[260px] w-full">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={categoryData}
                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="rgba(255,255,255,0.3)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          fontFamily="monospace"
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="rgba(255,255,255,0.4)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          fontFamily="monospace"
                          width={80}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="severity" name="Severity Index" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.severity >= 85 ? "#EF4444" : entry.severity >= 65 ? "#F59E0B" : "#2563EB"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <LoadingPulse variant="shimmer" width="100%" height="100%" />
                  )}
                </div>
              </div>

              {/* Protection Plan Mitigations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Incident Protection Plan</h2>
                </div>
                
                <div className="grid gap-3">
                  {(protectionPlan.length > 0 ? protectionPlan : [
                    {
                      id: "action-1",
                      title: "Block Domain & Host IP",
                      description: "Propagate firewall rules to block target URL and associated server IP address.",
                    },
                    {
                      id: "action-2",
                      title: "Report Sender to Abuse Teams",
                      description: "File automated abuse tickets to hosting registries and cloud flare filters.",
                    },
                    {
                      id: "action-3",
                      title: "Enforce Target Account MFA Reset",
                      description: "Trigger immediate forced MFA authentication reset for exposed employee inbox.",
                    },
                    {
                      id: "action-4",
                      title: "Ignore & Archive Correspondence",
                      description: "Isolate the threat payload and archive message securely in forensic logs.",
                    },
                    {
                      id: "action-5",
                      title: "Escalate to Tier 2 SOC Operations",
                      description: "Raise priority ticket to security incident queue #INC-9482.",
                    },
                  ]).map((action) => {
                    const isChecked = !!mitigationsCompleted[action.id];
                    return (
                      <div
                        key={action.id}
                        onClick={() => toggleMitigation(action.id)}
                        className={cn(
                          "group rounded-2xl border p-4 cursor-pointer transition-all duration-300 flex items-start gap-4",
                          isChecked
                            ? "bg-success/5 border-success/40 shadow-sm"
                            : "bg-surface/50 border-white/10 hover:bg-surface/90 hover:border-white/15"
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-lg border transition-all mt-0.5",
                            isChecked
                              ? "bg-success border-success text-black"
                              : "border-white/20 bg-white/5 text-transparent group-hover:border-white/30"
                          )}
                        >
                          <Check className="size-4 stroke-[3]" />
                        </div>

                        <div className="space-y-1">
                          <h3
                            className={cn(
                              "text-sm font-semibold transition-all",
                              isChecked ? "text-success/90 line-through" : "text-foreground"
                            )}
                          >
                            {action.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-4">{action.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* Related Threats */}
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="size-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Cross-Reference Related Threats</h2>
                <p className="text-xs text-muted-foreground">Historical detections possessing matched scam DNA signatures.</p>
              </div>
            </div>

            <StaggerContainer staggerChildren={0.08} className="grid gap-4 md:grid-cols-3">
              {relatedThreats.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Run additional analyses to populate related threat correlations.
                </p>
              ) : (
              relatedThreats.map((threat) => (
                <FadeIn
                  key={threat.id}
                  direction="up"
                  viewportTrigger={true}
                  className="rounded-2xl border border-white/5 bg-surface/40 p-5 space-y-4 hover:border-white/15 hover:bg-surface/70 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">{threat.id}</span>
                      <span className="text-muted-foreground">{threat.date}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate" title={threat.name}>
                      {threat.name}
                    </h3>
                    <p className="text-xs text-primary font-medium">{threat.category}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="text-muted-foreground">Score:</span>
                      <span className="font-semibold text-foreground">{threat.score}/100</span>
                    </div>

                    <Badge
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                        threat.level === "Critical" && "bg-danger/15 text-danger border-danger/25",
                        threat.level === "High" && "bg-orange-500/15 text-orange-500 border-orange-500/25",
                        threat.level === "Moderate" && "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
                        threat.level === "Safe" && "bg-success/15 text-success border-success/25"
                      )}
                    >
                      {threat.level}
                    </Badge>
                  </div>
                </FadeIn>
              ))
              )}
            </StaggerContainer>
          </div>

        </div>
      </main>
    </PageTransition>
  );
}
