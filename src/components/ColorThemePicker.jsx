import { COLOR_THEMES, useColorTheme } from "@/lib/ThemeContext";
import { Check } from "lucide-react";

export default function ColorThemePicker() {
  const { themeId, setThemeId } = useColorTheme();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color Theme</p>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_THEMES.map(theme => {
          const isSelected = themeId === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              title={theme.description}
              className={`relative rounded-xl border p-2.5 flex flex-col items-center gap-1.5 transition-all active:scale-95 min-h-[76px] ${
                isSelected ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
              }`}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </span>
              )}
              <div className="flex gap-0.5">
                {theme.preview.map((hex, i) => (
                  <span key={i} className="w-3 h-5 rounded-sm" style={{ background: hex }} />
                ))}
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}