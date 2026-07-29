import { useState } from "react";
import { Calculator, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const calculators = [
  { id: "concrete", label: "Concrete" },
  { id: "flooring", label: "Flooring" },
  { id: "paint", label: "Paint" },
  { id: "roofing", label: "Roofing" },
  { id: "drywall", label: "Drywall" },
];

function ConcreteCalc() {
  const [l, setL] = useState(""); const [w, setW] = useState(""); const [d, setD] = useState("");
  const yards = l && w && d ? ((parseFloat(l) * parseFloat(w) * (parseFloat(d) / 12)) / 27).toFixed(2) : null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Calculate cubic yards of concrete needed for a slab.</p>
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">Length (ft)</Label><Input type="number" placeholder="0" value={l} onChange={e => setL(e.target.value)} /></div>
        <div><Label className="text-xs">Width (ft)</Label><Input type="number" placeholder="0" value={w} onChange={e => setW(e.target.value)} /></div>
        <div><Label className="text-xs">Depth (in)</Label><Input type="number" placeholder="4" value={d} onChange={e => setD(e.target.value)} /></div>
      </div>
      {yards && <Result label="Cubic Yards" value={yards} note="Add 10% for waste" />}
    </div>
  );
}

function FlooringCalc() {
  const [l, setL] = useState(""); const [w, setW] = useState(""); const [waste, setWaste] = useState("10");
  const sqft = l && w ? (parseFloat(l) * parseFloat(w) * (1 + parseFloat(waste || 0) / 100)).toFixed(1) : null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Calculate square footage of flooring needed.</p>
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">Length (ft)</Label><Input type="number" placeholder="0" value={l} onChange={e => setL(e.target.value)} /></div>
        <div><Label className="text-xs">Width (ft)</Label><Input type="number" placeholder="0" value={w} onChange={e => setW(e.target.value)} /></div>
        <div><Label className="text-xs">Waste %</Label><Input type="number" placeholder="10" value={waste} onChange={e => setWaste(e.target.value)} /></div>
      </div>
      {sqft && <Result label="Square Feet" value={sqft} note={`Includes ${waste || 0}% waste`} />}
    </div>
  );
}

function PaintCalc() {
  const [l, setL] = useState(""); const [w, setW] = useState(""); const [h, setH] = useState(""); const [coats, setCoats] = useState("2");
  const gallons = l && w && h
    ? (((2 * (parseFloat(l) + parseFloat(w)) * parseFloat(h)) / 350) * parseFloat(coats || 1)).toFixed(1)
    : null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Calculate gallons of paint for a room (walls only).</p>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Length (ft)</Label><Input type="number" placeholder="0" value={l} onChange={e => setL(e.target.value)} /></div>
        <div><Label className="text-xs">Width (ft)</Label><Input type="number" placeholder="0" value={w} onChange={e => setW(e.target.value)} /></div>
        <div><Label className="text-xs">Height (ft)</Label><Input type="number" placeholder="8" value={h} onChange={e => setH(e.target.value)} /></div>
        <div><Label className="text-xs">Coats</Label><Input type="number" placeholder="2" value={coats} onChange={e => setCoats(e.target.value)} /></div>
      </div>
      {gallons && <Result label="Gallons" value={gallons} note="~350 sq ft per gallon" />}
    </div>
  );
}

function RoofingCalc() {
  const [l, setL] = useState(""); const [w, setW] = useState(""); const [pitch, setPitch] = useState("4");
  const pitchFactor = pitch ? Math.sqrt(1 + (parseFloat(pitch) / 12) ** 2) : 1;
  const squares = l && w ? ((parseFloat(l) * parseFloat(w) * pitchFactor) / 100 * 1.1).toFixed(2) : null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Calculate roofing squares needed (footprint + pitch).</p>
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">Length (ft)</Label><Input type="number" placeholder="0" value={l} onChange={e => setL(e.target.value)} /></div>
        <div><Label className="text-xs">Width (ft)</Label><Input type="number" placeholder="0" value={w} onChange={e => setW(e.target.value)} /></div>
        <div><Label className="text-xs">Pitch (x/12)</Label><Input type="number" placeholder="4" value={pitch} onChange={e => setPitch(e.target.value)} /></div>
      </div>
      {squares && <Result label="Roofing Squares" value={squares} note="Includes 10% waste" />}
    </div>
  );
}

function DrywallCalc() {
  const [l, setL] = useState(""); const [w, setW] = useState(""); const [h, setH] = useState("");
  const sheets = l && w && h
    ? Math.ceil((2 * (parseFloat(l) + parseFloat(w)) * parseFloat(h) * 1.1) / 32)
    : null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Calculate 4×8 drywall sheets for a room (walls only).</p>
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">Length (ft)</Label><Input type="number" placeholder="0" value={l} onChange={e => setL(e.target.value)} /></div>
        <div><Label className="text-xs">Width (ft)</Label><Input type="number" placeholder="0" value={w} onChange={e => setW(e.target.value)} /></div>
        <div><Label className="text-xs">Height (ft)</Label><Input type="number" placeholder="8" value={h} onChange={e => setH(e.target.value)} /></div>
      </div>
      {sheets && <Result label="4×8 Sheets" value={sheets} note="Includes 10% waste" />}
    </div>
  );
}

function Result({ label, value, note }) {
  return (
    <div className="bg-accent rounded-xl p-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

const calcComponents = {
  concrete: ConcreteCalc,
  flooring: FlooringCalc,
  paint: PaintCalc,
  roofing: RoofingCalc,
  drywall: DrywallCalc,
};

export default function ConstructionCalculator() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("concrete");
  const ActiveCalc = calcComponents[active];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Open calculator"
      >
        <Calculator className="w-5 h-5" />
      </button>

      {/* Drawer overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)", maxHeight: "85vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5" /> Calculator
                </h2>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
                {calculators.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActive(c.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active === c.id ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Calculator content */}
              <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 140px)" }}>
                <ActiveCalc />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}