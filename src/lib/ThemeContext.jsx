import { createContext, useContext, useEffect, useState } from "react";

export const COLOR_THEMES = [
  {
    id: "default",
    name: "Steel",
    description: "Classic dark slate",
    preview: ["#1c1917", "#a8a29e", "#e7e5e4"],
    vars: {
      "--background": "20 15% 10%",
      "--foreground": "30 20% 88%",
      "--card": "20 12% 13%",
      "--card-foreground": "30 20% 88%",
      "--primary": "0 0% 90%",
      "--primary-foreground": "0 0% 10%",
      "--secondary": "20 10% 17%",
      "--muted": "20 10% 17%",
      "--muted-foreground": "25 10% 60%",
      "--accent": "20 10% 20%",
      "--border": "20 10% 25%",
      "--input": "20 10% 25%",
    },
  },
  {
    id: "amber",
    name: "Amber",
    description: "Warm amber & tan",
    preview: ["#1c1508", "#d97706", "#fef3c7"],
    vars: {
      "--background": "30 25% 8%",
      "--foreground": "40 30% 90%",
      "--card": "30 20% 11%",
      "--card-foreground": "40 30% 90%",
      "--primary": "38 92% 50%",
      "--primary-foreground": "0 0% 5%",
      "--secondary": "30 15% 16%",
      "--muted": "30 15% 16%",
      "--muted-foreground": "35 15% 58%",
      "--accent": "30 15% 20%",
      "--border": "30 15% 22%",
      "--input": "30 15% 22%",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Earthy red & sand",
    preview: ["#1c0e0a", "#c2522a", "#f5e6d8"],
    vars: {
      "--background": "15 30% 8%",
      "--foreground": "25 35% 90%",
      "--card": "15 25% 11%",
      "--card-foreground": "25 35% 90%",
      "--primary": "18 70% 52%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "15 18% 16%",
      "--muted": "15 18% 16%",
      "--muted-foreground": "20 12% 58%",
      "--accent": "15 18% 20%",
      "--border": "15 18% 23%",
      "--input": "15 18% 23%",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep greens & bark",
    preview: ["#0a1410", "#3d7a50", "#d4ede1"],
    vars: {
      "--background": "150 20% 7%",
      "--foreground": "130 18% 88%",
      "--card": "150 18% 10%",
      "--card-foreground": "130 18% 88%",
      "--primary": "145 40% 42%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "150 12% 15%",
      "--muted": "150 12% 15%",
      "--muted-foreground": "140 8% 56%",
      "--accent": "150 12% 18%",
      "--border": "150 12% 21%",
      "--input": "150 12% 21%",
    },
  },
  {
    id: "navy",
    name: "Navy",
    description: "Deep blue & silver",
    preview: ["#080e1c", "#2d5fa6", "#c8d8f0"],
    vars: {
      "--background": "220 30% 8%",
      "--foreground": "210 25% 90%",
      "--card": "220 25% 11%",
      "--card-foreground": "210 25% 90%",
      "--primary": "215 65% 55%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "220 18% 16%",
      "--muted": "220 18% 16%",
      "--muted-foreground": "215 12% 58%",
      "--accent": "220 18% 20%",
      "--border": "220 18% 23%",
      "--input": "220 18% 23%",
    },
  },
  {
    id: "dusk",
    name: "Dusk",
    description: "Warm purple & gold",
    preview: ["#120e1a", "#7c4db5", "#f0d98a"],
    vars: {
      "--background": "265 22% 8%",
      "--foreground": "45 30% 90%",
      "--card": "265 18% 11%",
      "--card-foreground": "45 30% 90%",
      "--primary": "42 80% 58%",
      "--primary-foreground": "0 0% 5%",
      "--secondary": "265 14% 16%",
      "--muted": "265 14% 16%",
      "--muted-foreground": "260 10% 58%",
      "--accent": "265 14% 20%",
      "--border": "265 14% 23%",
      "--input": "265 14% 23%",
    },
  },
];

const ThemeColorContext = createContext(null);

export function ThemeColorProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem("color-theme") || "default");

  useEffect(() => {
    const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
    const root = document.documentElement;
    // Only apply in dark mode (our app defaults to dark)
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
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