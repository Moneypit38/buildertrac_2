import { Link } from "react-router-dom";
import { ClipboardList, MessageSquare, FileText, Camera } from "lucide-react";

const CARD_STYLES = [
  { icon: ClipboardList, color: "text-orange-400", border: "border-t-orange-400", activeColor: "text-orange-400" },
  { icon: MessageSquare, color: "text-green-400", border: "border-t-green-400", activeColor: "text-green-400" },
  { icon: FileText, color: "text-blue-400", border: "border-t-blue-400", activeColor: "text-blue-400" },
  { icon: Camera, color: "text-purple-400", border: "border-t-purple-400", activeColor: "text-purple-400" },
];

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => {
        const Wrapper = stat.href ? Link : "div";
        const hasAlert = stat.value > 0;
        const style = CARD_STYLES[i] || CARD_STYLES[0];
        const Icon = style.icon;
        return (
          <Wrapper key={i} to={stat.href}
            className={`bg-card border border-border border-t-2 ${style.border} rounded-xl p-4 transition-transform hover:scale-[1.02] relative overflow-hidden ${stat.href ? "cursor-pointer hover:border-primary/40" : ""}`}>
            {hasAlert && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-300 ring-2 ring-background animate-pulse" />
            )}
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${style.color}`} />
            </div>
            <div className={`text-3xl font-extrabold font-display ${hasAlert ? style.activeColor : "text-muted-foreground"}`}>{stat.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium leading-tight">{stat.label}</div>
          </Wrapper>
        );
      })}
    </div>
  );
}