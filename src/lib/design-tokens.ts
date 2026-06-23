export const designTokens = {
  colors: {
    background: "#0A0A0A",
    surface: "#111827",
    primary: "#2563EB",
    success: "#22C55E",
    danger: "#EF4444",
    foreground: "#F3F4F6",
    mutedForeground: "#94A3B8",
    border: "rgba(148, 163, 184, 0.16)",
  },
  radius: {
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  shadow: {
    panel:
      "0 0 0 1px rgba(255,255,255,0.02), 0 20px 80px rgba(0,0,0,0.45)",
  },
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },
} as const;

export type DesignTokens = typeof designTokens;
