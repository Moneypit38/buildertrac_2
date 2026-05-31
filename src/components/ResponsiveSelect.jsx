import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/**
 * On desktop: renders a standard Select.
 * On mobile: renders a trigger button + Drawer (bottom sheet) with tappable options.
 *
 * Props:
 *   value        – current value
 *   onValueChange – callback(newValue)
 *   placeholder  – shown when nothing selected
 *   options      – [{ value: string, label: string }]
 *   className    – extra class on the trigger
 */
export default function ResponsiveSelect({ value, onValueChange, placeholder = "Select…", options = [], className = "" }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-left ${className}`}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label || placeholder}
        </span>
        <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-primary">{placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-1 pb-10">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${value === o.value ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}