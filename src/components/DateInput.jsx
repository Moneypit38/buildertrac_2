import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";

// A date field with a calendar icon, so it's obvious that tapping it opens a calendar.
// When empty it shows a "Pick a date" hint (phones otherwise show a blank box).
export default function DateInput({ value, onChange, className = "", wrapperClassName = "", placeholder = "Pick a date", ...rest }) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none z-10" />
      {!value && (
        <span className="absolute left-9 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">{placeholder}</span>
      )}
      <Input
        type="date"
        value={value || ""}
        onChange={onChange}
        className={`pl-9 ${!value ? "text-transparent focus:text-foreground" : ""} ${className}`}
        {...rest}
      />
    </div>
  );
}
