import { COLOR_THEMES, useColorTheme } from "@/lib/ThemeContext";

export default function ColorThemePicker() {
  const { themeId, setThemeId } = useColorTheme();

  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Accent Color</p>
      <div className="flex flex-wrap gap-2">
        {COLOR_THEMES.map(theme => {
          const isSelected = themeId === theme.id;
          const swatchColor = theme.preview[0];
          return (
            <button
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              title={theme.name}
              className={`flex flex-col items-center gap-1 transition-all`}
            >
              <div
                className={`w-9 h-9 rounded-full transition-all ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                    : "opacity-70 hover:opacity-100 hover:scale-105"
                }`}
                style={{
                  background: theme.accent
                    ? `hsl(${theme.accent.h}, ${theme.accent.s}%, ${theme.accent.l}%)`
                    : "linear-gradient(135deg, #64748b, #94a3b8)",
                  ringColor: theme.accent
                    ? `hsl(${theme.accent.h}, ${theme.accent.s}%, ${theme.accent.l}%)`
                    : "#94a3b8",
                  boxShadow: isSelected
                    ? `0 0 0 2px var(--ring-offset, hsl(var(--background))), 0 0 0 4px ${
                        theme.accent
                          ? `hsl(${theme.accent.h}, ${theme.accent.s}%, ${theme.accent.l}%)`
                          : "#94a3b8"
                      }`
                    : "none",
                }}
              />
              <span className={`text-[10px] font-medium leading-none ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}