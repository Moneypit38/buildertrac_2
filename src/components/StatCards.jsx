import { Link } from "react-router-dom";

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => {
        const Wrapper = stat.href ? Link : "div";
        const hasAlert = stat.value > 0;
        return (
          <Wrapper key={i} to={stat.href}
            className={`bg-card border border-border rounded-xl p-4 text-center transition-transform hover:scale-[1.02] relative overflow-hidden ${stat.href ? "cursor-pointer hover:border-primary/50" : ""} ${hasAlert ? "border-t-2 border-t-orange-400" : "border-t-2 border-t-border"}`}>
            {hasAlert && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-yellow-300 ring-2 ring-background animate-pulse" />
            )}
            <div className={`text-3xl font-extrabold font-display ${hasAlert ? "text-orange-400" : "text-muted-foreground"}`}>{stat.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">{stat.label}</div>
          </Wrapper>
        );
      })}
    </div>
  );
}