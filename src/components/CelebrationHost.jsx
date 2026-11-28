import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const COLORS = ["#F5A623", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#facc15"];

// Listens for the "celebrate" event and plays a short confetti burst with a check badge.
export default function CelebrationHost() {
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    let timer;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const onCelebrate = (e) => {
      const pieces = reduce ? [] : Array.from({ length: 36 }, (_, i) => ({
        i, x: (Math.random() - 0.5) * 340, up: -(110 + Math.random() * 230), r: Math.random() * 720 - 360,
        c: COLORS[i % COLORS.length], s: 6 + Math.random() * 6, round: i % 3 === 0,
      }));
      setBurst({ id: Date.now(), text: e.detail?.text || "Follow-up done!", pieces });
      clearTimeout(timer);
      timer = setTimeout(() => setBurst(null), 2000);
    };
    window.addEventListener("celebrate", onCelebrate);
    return () => { window.removeEventListener("celebrate", onCelebrate); clearTimeout(timer); };
  }, []);

  return (
    <AnimatePresence>
      {burst && (
        <div key={burst.id} className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center" aria-live="polite">
          {burst.pieces.map((p) => (
            <motion.span
              key={p.i}
              className="absolute"
              style={{ width: p.s, height: p.s * (p.round ? 1 : 1.6), background: p.c, borderRadius: p.round ? 9999 : 2 }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: [0, p.up, p.up + 260], opacity: [1, 1, 0], rotate: p.r }}
              transition={{ duration: 1.5, ease: "easeOut", times: [0, 0.45, 1] }}
            />
          ))}
          <motion.div
            className="relative flex items-center gap-2 bg-card border-2 border-primary rounded-2xl px-5 py-3 shadow-xl"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.12, 1], opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.45 }}
          >
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <span className="font-bold text-sm">{burst.text}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
