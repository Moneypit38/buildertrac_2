import { COLOR_THEMES, useColorTheme } from "@/lib/ThemeContext";

export default function ColorThemePicker() {
  const { themeId, setThemeId } = useColorTheme();

  return (
    <div className="px-4 py-3">
      <p className="text-sm font-medium mb-3">Color Theme</p>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => setThemeId(theme.id)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-colors ${
              themeId === theme.id ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
            }`}
          >
            {/* Color swatch */}
            <div className="flex gap-0.5 rounded-md overflow-hidden w-full h-6">
              {theme.preview.map((color, i) => (
                <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
              ))}
            </div>
            <p className="text-[11px] font-semibold leading-none">{theme.name}</p>
            <p className="text-[10px] text-muted-foreground leading-none">{theme.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}