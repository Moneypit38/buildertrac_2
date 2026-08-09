import { createContext, useContext, useEffect, useState } from "react";

// 12 cohesive color themes. Each theme carries an accent (applied to
// primary/ring/chart-1) plus a coordinated 4-color palette for the dashboard
// stat cards, so picking one theme styles the whole app consistently.

export const COLOR_THEMES = [
  {
    id: "steel",
    name: "Steel",
    description: "Mono grey",
    accent: null,
    preview: ["#64748b", "#94a3b8", "#475569", "#cbd5e1"],
    statColors: ["#64748b", "#94a3b8", "#475569", "#cbd5e1"],
  },
  {
    id: "amber",
    name: "Amber",
    description: "Warm gold",
    accent: { h: 38, s: 92, l: 50 },
    preview: ["#d97706", "#f59e0b", "#f97316", "#fbbf24"],
    statColors: ["#d97706", "#f59e0b", "#f97316", "#fbbf24"],
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Earthy red",
    accent: { h: 18, s: 70, l: 52 },
    preview: ["#c2522a", "#e06b40", "#d97706", "#92400e"],
    statColors: ["#c2522a", "#e06b40", "#d97706", "#92400e"],
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green",
    accent: { h: 145, s: 40, l: 42 },
    preview: ["#2d6a4f", "#10b981", "#14b8a6", "#84cc16"],
    statColors: ["#2d6a4f", "#10b981", "#14b8a6", "#84cc16"],
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue",
    accent: { h: 215, s: 65, l: 55 },
    preview: ["#1e3a5f", "#3b82f6", "#0ea5e9", "#06b6d4"],
    statColors: ["#1e3a5f", "#3b82f6", "#0ea5e9", "#06b6d4"],
  },
  {
    id: "dusk",
    name: "Dusk",
    description: "Purple",
    accent: { h: 270, s: 55, l: 58 },
    preview: ["#7c4db5", "#a855f7", "#8b5cf6", "#d946ef"],
    statColors: ["#7c4db5", "#a855f7", "#8b5cf6", "#d946ef"],
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Rose & pink",
    accent: { h: 340, s: 75, l: 58 },
    preview: ["#f43f5e", "#ec4899", "#f97316", "#ef4444"],
    statColors: ["#f43f5e", "#ec4899", "#f97316", "#ef4444"],
  },
  {
    id: "mint",
    name: "Mint",
    description: "Cool teal",
    accent: { h: 172, s: 65, l: 42 },
    preview: ["#14b8a6", "#06b6d4", "#10b981", "#0ea5e9"],
    statColors: ["#14b8a6", "#06b6d4", "#10b981", "#0ea5e9"],
  },
  {
    id: "violet",
    name: "Violet",
    description: "Indigo",
    accent: { h: 245, s: 60, l: 60 },
    preview: ["#6366f1", "#8b5cf6", "#a855f7", "#3b82f6"],
    statColors: ["#6366f1", "#8b5cf6", "#a855f7", "#3b82f6"],
  },
  {
    id: "crimson",
    name: "Crimson",
    description: "Bold red",
    accent: { h: 0, s: 75, l: 56 },
    preview: ["#ef4444", "#f43f5e", "#dc2626", "#c2522a"],
    statColors: ["#ef4444", "#f43f5e", "#dc2626", "#c2522a"],
  },
  {
    id: "golden",
    name: "Golden",
    description: "Yellow gold",
    accent: { h: 45, s: 90, l: 50 },
    preview: ["#eab308", "#f59e0b", "#84cc16", "#d97706"],
    statColors: ["#eab308", "#f59e0b", "#84cc16", "#d97706"],
  },
  {
    id: "slate",
    name: "Slate",
    description: "Industrial blue-grey",
    accent: { h: 210, s: 28, l: 50 },
    preview: ["#475569", "#64748b", "#334155", "#94a3b8"],
    statColors: ["#475569", "#64748b", "#334155", "#94a3b8"],
  },
  {
    id: "christmas",
    name: "Christmas",
    description: "Red & green",
    holiday: true,
    accent: { h: 350, s: 72, l: 42 },
    preview: ["#c8102e", "#0f5132", "#d4af37", "#16a34a"],
    statColors: ["#c8102e", "#0f5132", "#d4af37", "#16a34a"],
  },
  {
    id: "newyear",
    name: "New Year's",
    description: "Midnight & gold",
    holiday: true,
    accent: { h: 230, s: 55, l: 48 },
    preview: ["#1e293b", "#d4af37", "#6366f1", "#cbd5e1"],
    statColors: ["#1e293b", "#d4af37", "#6366f1", "#94a3b8"],
  },
  {
    id: "fourth",
    name: "Fourth of July",
    description: "Red, white & blue",
    holiday: true,
    accent: { h: 224, s: 80, l: 48 },
    preview: ["#b22234", "#3c3b6e", "#dc2626", "#3b82f6"],
    statColors: ["#b22234", "#3c3b6e", "#dc2626", "#3b82f6"],
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    description: "Autumn harvest",
    holiday: true,
    accent: { h: 25, s: 70, l: 45 },
    preview: ["#b3590f", "#92400e", "#ca8a04", "#65734e"],
    statColors: ["#b3590f", "#92400e", "#ca8a04", "#65734e"],
  },
];

const ThemeColorContext = createContext(null);

export function ThemeColorProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem("color-theme") || "steel");

  useEffect(() => {
    const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
    const root = document.documentElement;

    if (!theme.accent) {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--chart-1");
    } else {
      const { h, s, l } = theme.accent;
      const hsl = `${h} ${s}% ${l}%`;
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--chart-1", hsl);
      root.style.setProperty("--primary-foreground", l > 55 ? "0 0% 5%" : "0 0% 98%");
    }
    localStorage.setItem("color-theme", themeId);
  }, [themeId]);

  const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
  const statColors = theme.statColors;

  return (
    <ThemeColorContext.Provider value={{ themeId, setThemeId, theme, statColors }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useColorTheme() {
  return useContext(ThemeColorContext);
}