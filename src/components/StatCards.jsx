import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, MessageSquare, FileText, Camera } from "lucide-react";
import { useColorTheme, CARD_COLORS } from "@/lib/ThemeContext";

const ICONS = [ClipboardList, MessageSquare, FileText, Camera];
const STAT_KEYS = ["stat-0", "stat-1", "stat-2", "stat-3"];

function ColorPickerPopover({ colorId, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-6 right-0 z-50 bg-card border border-border rounded-xl shadow-xl p-2.5 flex flex-wrap gap-1.5"
      style={{ width: 156 }}
      onClick={e => e.preventDefault()}
    >
      {CARD_COLORS.map(c => (
        <button
          key={c.id}
          title={c.name}
          onClick={(e) => { e.preventDefault(); onSelect(c.id); onClose(); }}
          className="w-6 h-6 rounded-full transition-all"
          style={{
            background: c.hex,
            boxShadow: colorId === c.id ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${c.hex}` : "none",
            transform: colorId === c.id ? "scale(1.15)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}

export default function StatCards({ stats }) {
  const { statCardColors, setStatCardColor, cardColorId } = useColorTheme();
  const [openPicker, setOpenPicker] = useState(null); // index of open picker

  const getCardHex = (i) => {
    const key = STAT_KEYS[i];
    const colorId = statCardColors[key] || cardColorId;
    return (CARD_COLORS.find(c => c.id === colorId) || CARD_COLORS[0]).hex;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => {
        const Wrapper = stat.href ? Link : "div";
        const hasAlert = stat.value > 0;
        const Icon = ICONS[i] || ICONS[0];
        const accentHex = getCardHex(i);
        const key = STAT_KEYS[i];
        const colorId = statCardColors[key] || cardColorId;

        return (
          <Wrapper
            key={i}
            to={stat.href}
            className={`bg-card border border-border border-t-2 rounded-xl p-4 transition-transform hover:scale-[1.02] relative overflow-visible ${stat.href ? "cursor-pointer" : ""}`}
            style={{ borderTopColor: accentHex }}
          >
            {hasAlert && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-300 ring-2 ring-background animate-pulse" />
            )}

            {/* Color picker dot */}
            <div className="absolute bottom-2.5 right-2.5 relative z-10">
              <button
                onClick={(e) => { e.preventDefault(); setOpenPicker(openPicker === i ? null : i); }}
                className="w-3.5 h-3.5 rounded-full border-2 border-card ring-1 ring-border transition-transform hover:scale-110"
                style={{ background: accentHex }}
                title="Pick color"
              />
              {openPicker === i && (
                <ColorPickerPopover
                  colorId={colorId}
                  onSelect={(id) => setStatCardColor(key, id)}
                  onClose={() => setOpenPicker(null)}
                />
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" style={{ color: accentHex }} />
            </div>
            <div
              className={`text-3xl font-extrabold font-display ${!hasAlert ? "text-muted-foreground" : ""}`}
              style={hasAlert ? { color: accentHex } : {}}
            >
              {stat.value}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium leading-tight">{stat.label}</div>
          </Wrapper>
        );
      })}
    </div>
  );
}