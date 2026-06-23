import type { ThreatAnalysisResponse } from "@/types";

export type AnalysisType = "Screenshot" | "URL" | "Text";
export type ThreatLevel = "Safe" | "Moderate" | "High" | "Critical";

export interface AnalysisRecord {
  id: string;
  name: string;
  type: AnalysisType;
  level: ThreatLevel;
  date: string;
  status: "Completed" | "Failed" | "Analyzing";
  score: number;
  category: string;
  confidence: number;
  result: ThreatAnalysisResponse;
  timestamp: string;
}

const HISTORY_KEY = "sentinel_analysis_history";
const MAX_HISTORY = 50;

export function loadAnalysisHistory(): AnalysisRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalysisRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysisToHistory(
  record: Omit<AnalysisRecord, "result"> & { result: ThreatAnalysisResponse }
): AnalysisRecord[] {
  const entry: AnalysisRecord = { ...record };
  const existing = loadAnalysisHistory().filter((item) => item.id !== entry.id);
  const updated = [entry, ...existing].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function buildTimelineFromHistory(history: AnalysisRecord[]) {
  return history.slice(0, 7).map((item) => ({
    time: item.timestamp.slice(11, 16) || item.date,
    threats: item.score,
    blocks: item.level === "Safe" ? Math.max(0, item.score - 20) : item.score,
  }));
}

export function buildCategoryBreakdown(history: AnalysisRecord[]) {
  const grouped = new Map<string, { total: number; count: number }>();
  for (const item of history) {
    const key = item.category || "Unknown";
    const current = grouped.get(key) ?? { total: 0, count: 0 };
    grouped.set(key, {
      total: current.total + item.score,
      count: current.count + 1,
    });
  }
  return Array.from(grouped.entries())
    .map(([name, { total, count }]) => ({
      name,
      severity: Math.round(total / count),
    }))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 6);
}

export function buildLevelDistribution(history: AnalysisRecord[]) {
  const levels: Record<ThreatLevel, number> = {
    Critical: 0,
    High: 0,
    Moderate: 0,
    Safe: 0,
  };
  for (const item of history) {
    levels[item.level] += 1;
  }
  return [
    { name: "Critical", value: levels.Critical, color: "#EF4444" },
    { name: "High", value: levels.High, color: "#F59E0B" },
    { name: "Moderate", value: levels.Moderate, color: "#6366F1" },
    { name: "Safe", value: levels.Safe, color: "#10B981" },
  ];
}

export function formatRiskLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
