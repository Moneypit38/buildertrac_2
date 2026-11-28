import { LOG_TYPES } from "@/lib/logTypes";

// Five equal, centered choices: three on the first row, two (wider) on the second.
export default function LogTypePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {LOG_TYPES.map((t, i) => {
        const Icon = t.icon;
        const on = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`${i < 3 ? "col-span-2" : "col-span-3"} flex flex-col items-center justify-center gap-1 h-16 rounded-xl border text-xs font-medium text-center transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="leading-none">{t.id}</span>
          </button>
        );
      })}
    </div>
  );
}
