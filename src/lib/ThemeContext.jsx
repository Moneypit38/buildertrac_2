import { createContext, useContext, useEffect, useState } from "react";

// Each theme only overrides the accent/highlight/ring/chart-1 color.
// The base mono palette (backgrounds, cards, borders) stays intact from index.css.
export const COLOR_THEMES = [
  {
    id: "default",
    name: "Steel",
    description: "Mono grey",
    preview: ["#64748b", "#94a3b8", "#cbd5e1"],
    accent: null, // uses the CSS default (no override)
  },
  {
    id: "amber",
    name: "Amber",
    description: "Warm gold",
    preview: ["#d97706", "#f59e0b", "#fcd34d"],
    accent: { h: 38, s: 92, l: 50 },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Earthy red",
    preview: ["#c2522a", "#e06b40", "#f5a07a"],
    accent: { h: 18, s: 70, l: 52 },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green",
    preview: ["#2d6a4f", "#3d7a50", "#74c69d"],
    accent: { h: 145, s: 40, l: 42 },
  },
  {
    id: "navy",
    name: "Navy",
    description: "Deep blue",
    preview: ["#1e3a5f", "#2d5fa6", "#6daee8"],
    accent: { h: 215, s: 65, l: 55 },
  },
  {
    id: "dusk",
    name: "Dusk",
    description: "Purple & gold",
    preview: ["#7c4db5", "#9b6dd1", "#c9a4e8"],
    accent: { h: 270, s: 55, l: 58 },
  },
];

const ThemeColorContext = createContext(null);

export function ThemeColorProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem("color-theme") || "default");

  useEffect(() => {
    const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
    const root = document.documentElement;

    if (!theme.accent) {
      // Reset to CSS defaults — remove any overrides
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--chart-1");
    } else {
      const { h, s, l } = theme.accent;
      const hsl = `${h} ${s}% ${l}%`;
      // In dark mode: primary = the accent color
      // In light mode: primary stays dark (foreground), but we push the accent into ring + chart
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--chart-1", hsl);
      // foreground on colored primary should be white or very dark depending on lightness
      root.style.setProperty("--primary-foreground", l > 55 ? "0 0% 5%" : "0 0% 98%");
    }

    localStorage.setItem("color-theme", themeId);
  }, [themeId]);

  return (
    <ThemeColorContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useColorTheme() {
  return useContext(ThemeColorContext);
}