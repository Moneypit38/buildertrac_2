import { Link } from "react-router-dom";
import { ClipboardList, MessageSquare, FileText, Camera } from "lucide-react";
import { useColorTheme } from "@/lib/ThemeContext";

const ICONS = [ClipboardList, MessageSquare, FileText, Camera];

export default function StatCards({ stats }) {
  const { statColors } = useColorTheme();

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => {
        const Wrapper = stat.href ? Link : "div";
        const hasAlert = stat.value > 0;
        const Icon = ICONS[i] || ICONS[0];
        const accentHex = statColors[i] || statColors[0];

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