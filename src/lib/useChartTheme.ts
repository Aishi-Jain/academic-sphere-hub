import { useMemo } from "react";
import { useTheme } from "next-themes";

type ChartTheme = {
  text: string;
  muted: string;
  grid: string;
  surface: string;
  violet: string;
  cyan: string;
  blue: string;
  green: string;
  amber: string;
  rose: string;
  palette: string[];
};

const fallbackTheme: ChartTheme = {
  text: "#f5f7ff",
  muted: "#9aa4c7",
  grid: "rgba(125,145,255,0.14)",
  surface: "#0c1018",
  violet: "#7c3aed",
  cyan: "#16d9ff",
  blue: "#2f6bff",
  green: "#2de2a7",
  amber: "#f59e0b",
  rose: "#fb7185",
  palette: ["#7c3aed", "#16d9ff", "#2de2a7", "#2f6bff", "#f59e0b", "#fb7185"],
};

export const useChartTheme = (): ChartTheme => {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    if (typeof window === "undefined") return fallbackTheme;

    const styles = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

    const theme = {
      text: read("--text-primary", fallbackTheme.text),
      muted: read("--text-muted", fallbackTheme.muted),
      grid: read("--border-soft", fallbackTheme.grid),
      surface: read("--bg-surface", fallbackTheme.surface),
      violet: read("--accent-violet", fallbackTheme.violet),
      cyan: read("--accent-cyan", fallbackTheme.cyan),
      blue: read("--accent-blue", fallbackTheme.blue),
      green: read("--accent-green", fallbackTheme.green),
      amber: fallbackTheme.amber,
      rose: fallbackTheme.rose,
      palette: [
        read("--accent-violet", fallbackTheme.violet),
        read("--accent-cyan", fallbackTheme.cyan),
        read("--accent-green", fallbackTheme.green),
        read("--accent-blue", fallbackTheme.blue),
        fallbackTheme.amber,
        fallbackTheme.rose,
      ],
    };

    return theme;
  }, [resolvedTheme]);
};
