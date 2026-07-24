import { createContext, useContext, useEffect, useState } from "react";

// Separate palette for stat card accent colors
export const CARD_COLORS = [
  { id: "card-slate",       name: "Slate",       hex: "#64748b" },
  { id: "card-gray",        name: "Gray",        hex: "#9ca3af" },
  { id: "card-zinc",        name: "Zinc",        hex: "#71717a" },
  { id: "card-red",         name: "Red",         hex: "#ef4444" },
  { id: "card-rose",        name: "Rose",        hex: "#f43f5e" },
  { id: "card-pink",        name: "Pink",        hex: "#ec4899" },
  { id: "card-fuchsia",     name: "Fuchsia",     hex: "#d946ef" },
  { id: "card-purple",      name: "Purple",      hex: "#a855f7" },
  { id: "card-violet",      name: "Violet",      hex: "#8b5cf6" },
  { id: "card-indigo",      name: "Indigo",      hex: "#6366f1" },
  { id: "card-blue",        name: "Blue",        hex: "#3b82f6" },
  { id: "card-sky",         name: "Sky",         hex: "#0ea5e9" },
  { id: "card-cyan",        name: "Cyan",        hex: "#06b6d4" },
  { id: "card-teal",        name: "Teal",        hex: "#14b8a6" },
  { id: "card-emerald",     name: "Emerald",     hex: "#10b981" },
  { id: "card-green",       name: "Green",       hex: "#22c55e" },
  { id: "card-lime",        name: "Lime",        hex: "#84cc16" },
  { id: "card-yellow",      name: "Yellow",      hex: "#eab308" },
  { id: "card-amber",       name: "Amber",       hex: "#d97706" },
  { id: "card-orange",      name: "Orange",      hex: "#f97316" },
  { id: "card-terracotta",  name: "Terracotta",  hex: "#c2522a" },
  { id: "card-brown",       name: "Brown",       hex: "#92400e" },
];

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

// Keys for per-stat card colors (4 cards on the dashboard)
export const STAT_CARD_KEYS = ["stat-0", "stat-1", "stat-2", "stat-3"];

export function ThemeColorProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem("color-theme") || "default");
  const [cardColorId, setCardColorId] = useState(() => localStorage.getItem("card-color") || "card-orange");

  // Per-stat-card color: { "stat-0": "card-orange", "stat-1": "card-blue", ... }
  const [statCardColors, setStatCardColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem("stat-card-colors") || "{}"); } catch { return {}; }
  });

  const setStatCardColor = (key, colorId) => {
    setStatCardColors(prev => {
      const next = { ...prev, [key]: colorId };
      localStorage.setItem("stat-card-colors", JSON.stringify(next));
      return next;
    });
  };

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

  const handleSetCardColorId = (id) => {
    setCardColorId(id);
    localStorage.setItem("card-color", id);
  };

  return (
    <ThemeColorContext.Provider value={{ themeId, setThemeId, cardColorId, setCardColorId: handleSetCardColorId, statCardColors, setStatCardColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useColorTheme() {
  return useContext(ThemeColorContext);
}