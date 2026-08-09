import { motion } from "framer-motion";
import { useColorTheme } from "@/lib/ThemeContext";

const HOLIDAYS = {
  fourth: { emoji: "🇺🇸", accent: "🎆", text: "Happy 4th" },
  christmas: { emoji: "🎅", accent: "🎄", text: "Merry Christmas" },
  newyear: { emoji: "🎉", accent: "🎆", text: "Happy New Year" },
  thanksgiving: { emoji: "🦃", accent: "🍂", text: "Happy Thanksgiving" },
  halloween: { emoji: "👻", accent: "🕸️", text: "Happy Halloween" },
};

export default function HolidayHeader() {
  const { themeId } = useColorTheme();
  const h = HOLIDAYS[themeId];
  if (!h) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -2, 0] }}
      transition={{ duration: 0.3, y: { repeat: Infinity, duration: 2.4, ease: "easeInOut" } }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent border border-border"
    >
      <span className="text-base leading-none">{h.emoji}</span>
      <span className="text-[11px] font-semibold text-foreground whitespace-nowrap max-[380px]:hidden">{h.text}</span>
      <span className="text-sm leading-none">{h.accent}</span>
    </motion.div>
  );
}