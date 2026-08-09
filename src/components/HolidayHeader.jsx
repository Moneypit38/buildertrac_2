import { motion } from "framer-motion";
import { useColorTheme } from "@/lib/ThemeContext";

const HOLIDAYS = {
  christmas: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/abadb57bd_generated_image.png",
  newyear: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/e80afb006_generated_image.png",
  fourth: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/c4ba8d684_generated_image.png",
  thanksgiving: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/9bcc14cff_generated_image.png",
  halloween: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/a63323772_generated_image.png",
};

export default function HolidayHeader() {
  const { themeId } = useColorTheme();
  const url = HOLIDAYS[themeId];
  if (!url) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
      animate={{ opacity: 1, scale: 1, rotate: [0, -1.5, 1.5, 0] }}
      transition={{ duration: 0.3, rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
      className="w-9 h-9 rounded-full overflow-hidden border border-border shadow-sm flex-shrink-0 bg-muted"
    >
      <img src={url} alt="Holiday artwork" className="w-full h-full object-cover" />
    </motion.div>
  );
}