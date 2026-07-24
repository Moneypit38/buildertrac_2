import { COLOR_THEMES, CARD_COLORS, useColorTheme } from "@/lib/ThemeContext";

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
  const { themeId, setThemeId, cardColorId, setCardColorId } = useColorTheme();

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
    </div>
  );
}