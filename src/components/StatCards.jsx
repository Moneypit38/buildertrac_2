export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <div key={i} className="bg-card border border-border border-t-2 border-t-primary rounded-xl p-4 text-center transition-transform hover:scale-[1.02]">
          <div className="text-3xl font-extrabold font-display text-primary">{stat.value}</div>
          <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}