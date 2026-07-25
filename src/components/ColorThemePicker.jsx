import { COLOR_THEMES, CARD_COLORS, STAT_CARD_KEYS, useColorTheme } from "@/lib/ThemeContext";
import { ClipboardList, MessageSquare, FileText, Camera } from "lucide-react";

const STAT_CARD_LABELS = ["Tasks", "Messages", "Documents", "Photos"];
const STAT_CARD_ICONS = [ClipboardList, MessageSquare, FileText, Camera];

function Swatch({ color, isSelected, onSelect, size = "w-8 h-8" }) {
  return (
    <button
      onClick={() => onSelect(color.id)}
      title={color.name}
      className="flex flex-col items-center gap-1 transition-all"
    >
      <div
        className={`${size} rounded-full transition-all`}
        style={{
          background: color.hex || (color.accent
            ? `hsl(${color.accent.h}, ${color.accent.s}%, ${color.accent.l}%)`
            : "linear-gradient(135deg, #64748b, #94a3b8)"),
          boxShadow: isSelected
            ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${color.hex || (color.accent ? `hsl(${color.accent.h}, ${color.accent.s}%, ${color.accent.l}%)` : "#94a3b8")}`
            : "none",
          opacity: isSelected ? 1 : 0.65,
          transform: isSelected ? "scale(1.12)" : "scale(1)",
        }}
      />
      <span className={`text-[10px] font-medium leading-none ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
        {color.name}
      </span>
    </button>
  );
}

export default function ColorThemePicker() {
  const { themeId, setThemeId, cardColorId, setCardColorId, statCardColors, setStatCardColor } = useColorTheme();

  // Adapt COLOR_THEMES entries to have a .hex for the Swatch component
  const accentThemes = COLOR_THEMES.map(t => ({
    ...t,
    hex: t.accent ? `hsl(${t.accent.h}, ${t.accent.s}%, ${t.accent.l}%)` : null,
  }));

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Accent / UI theme */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Accent Color</p>
        <div className="flex flex-wrap gap-2">
          {accentThemes.map(theme => (
            <Swatch
              key={theme.id}
              color={theme}
              isSelected={themeId === theme.id}
              onSelect={setThemeId}
            />
          ))}
        </div>
      </div>

      {/* Card highlight color */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Card Color</p>
        <div className="flex flex-wrap gap-2">
          {CARD_COLORS.map(color => (
            <Swatch
              key={color.id}
              color={color}
              isSelected={cardColorId === color.id}
              onSelect={setCardColorId}
            />
          ))}
        </div>
      </div>

      {/* Per-stat-card colors */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Individual Card Colors</p>
        <div className="space-y-3">
          {STAT_CARD_KEYS.map((key, i) => {
            const Icon = STAT_CARD_ICONS[i];
            const selectedId = statCardColors[key] || cardColorId;
            return (
              <div key={key}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground">{STAT_CARD_LABELS[i]}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CARD_COLORS.map(color => (
                    <button
                      key={color.id}
                      title={color.name}
                      onClick={() => setStatCardColor(key, color.id)}
                      className="w-5 h-5 rounded-full transition-all"
                      style={{
                        background: color.hex,
                        boxShadow: selectedId === color.id ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${color.hex}` : "none",
                        transform: selectedId === color.id ? "scale(1.2)" : "scale(1)",
                        opacity: selectedId === color.id ? 1 : 0.6,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}