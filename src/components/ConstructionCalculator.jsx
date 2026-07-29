import { useState } from "react";
import { Calculator, X, Delete } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MODES = [
  { id: "standard", label: "Standard" },
  { id: "concrete", label: "Concrete" },
  { id: "flooring", label: "Flooring" },
  { id: "roofing", label: "Roofing" },
];

// ── Standard calculator ──────────────────────────────────────────────────────
function StandardCalc() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(false);

  const press = (val) => {
    if (val === "C") { setDisplay("0"); setPrev(null); setOp(null); setFresh(false); return; }
    if (val === "⌫") { setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0"); return; }
    if (val === "%") { setDisplay(d => String(parseFloat(d) / 100)); return; }
    if (val === "+/-") { setDisplay(d => d.startsWith("-") ? d.slice(1) : "-" + d); return; }

    if (["+", "-", "×", "÷"].includes(val)) {
      setPrev(parseFloat(display));
      setOp(val);
      setFresh(true);
      return;
    }

    if (val === "=") {
      if (op && prev !== null) {
        const cur = parseFloat(display);
        const ops = { "+": prev + cur, "-": prev - cur, "×": prev * cur, "÷": prev / cur };
        const result = ops[op];
        setDisplay(String(parseFloat(result.toFixed(10))));
        setPrev(null); setOp(null); setFresh(false);
      }
      return;
    }

    if (val === "." && display.includes(".") && !fresh) return;
    setDisplay(d => {
      if (fresh) { setFresh(false); return val === "." ? "0." : val; }
      if (d === "0" && val !== ".") return val;
      return d + val;
    });
  };

  const rows = [
    ["C", "+/-", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
  ];

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className="bg-secondary rounded-xl px-4 py-3 text-right">
        {op && <p className="text-xs text-muted-foreground">{prev} {op}</p>}
        <p className="text-4xl font-light tracking-tight truncate">{display}</p>
      </div>
      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2">
        {rows.flat().map((k, i) => {
          const isOp = ["+", "-", "×", "÷"].includes(k);
          const isEq = k === "=";
          const isFn = ["C", "+/-", "%"].includes(k);
          return (
            <Key key={i} label={k} onClick={() => press(k)}
              className={isEq ? "bg-primary text-primary-foreground" : isOp ? "bg-primary/20 text-primary font-semibold" : isFn ? "bg-muted text-muted-foreground" : "bg-card border border-border"}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Concrete calculator ───────────────────────────────────────────────────────
function ConcreteCalc() {
  const fields = [
    { id: "length", label: "Length (ft)" },
    { id: "width", label: "Width (ft)" },
    { id: "depth", label: "Depth (in)" },
  ];
  return <FieldCalc fields={fields} compute={({ length, width, depth }) => {
    const cy = (length * width * (depth / 12)) / 27;
    return [
      { label: "Cubic Yards", value: cy.toFixed(2) },
      { label: "With 10% Waste", value: (cy * 1.1).toFixed(2) },
      { label: "80lb Bags (alt)", value: Math.ceil(cy * 45) },
    ];
  }} />;
}

// ── Flooring calculator ───────────────────────────────────────────────────────
function FlooringCalc() {
  const fields = [
    { id: "length", label: "Length (ft)" },
    { id: "width", label: "Width (ft)" },
    { id: "waste", label: "Waste %" },
  ];
  return <FieldCalc fields={fields} defaults={{ waste: "10" }} compute={({ length, width, waste }) => {
    const base = length * width;
    const total = base * (1 + waste / 100);
    return [
      { label: "Base Sq Ft", value: base.toFixed(1) },
      { label: "With Waste", value: total.toFixed(1) },
    ];
  }} />;
}

// ── Roofing calculator ────────────────────────────────────────────────────────
function RoofingCalc() {
  const fields = [
    { id: "length", label: "Length (ft)" },
    { id: "width", label: "Width (ft)" },
    { id: "pitch", label: "Pitch (x/12)" },
  ];
  return <FieldCalc fields={fields} defaults={{ pitch: "4" }} compute={({ length, width, pitch }) => {
    const factor = Math.sqrt(1 + (pitch / 12) ** 2);
    const sqft = length * width * factor * 1.1;
    return [
      { label: "Roofing Squares", value: (sqft / 100).toFixed(2) },
      { label: "Square Feet", value: sqft.toFixed(1) },
    ];
  }} />;
}

// ── Shared field+keypad component ─────────────────────────────────────────────
function FieldCalc({ fields, compute, defaults = {} }) {
  const init = fields.reduce((a, f) => ({ ...a, [f.id]: defaults[f.id] || "" }), {});
  const [vals, setVals] = useState(init);
  const [active, setActive] = useState(fields[0].id);

  const press = (k) => {
    setVals(prev => {
      const cur = prev[active] || "";
      if (k === "C") return { ...prev, [active]: "" };
      if (k === "⌫") return { ...prev, [active]: cur.slice(0, -1) };
      if (k === "." && cur.includes(".")) return prev;
      if (cur === "0" && k !== ".") return { ...prev, [active]: k };
      return { ...prev, [active]: cur + k };
    });
  };

  const nums = vals;
  const parsed = fields.reduce((a, f) => ({ ...a, [f.id]: parseFloat(nums[f.id]) }), {});
  const ready = fields.every(f => nums[f.id] !== "" && !isNaN(parseFloat(nums[f.id])));
  const results = ready ? compute(parsed) : null;

  const rows = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [".", "0", "⌫"],
  ];

  return (
    <div className="space-y-3">
      {/* Field selector */}
      <div className="grid gap-2">
        {fields.map(f => (
          <button key={f.id} onClick={() => setActive(f.id)}
            className={`flex justify-between items-center px-3 py-2 rounded-xl border text-sm transition-colors ${active === f.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <span className="text-muted-foreground">{f.label}</span>
            <span className="font-semibold text-foreground min-w-[60px] text-right">{vals[f.id] || "—"}</span>
          </button>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {rows.flat().map((k, i) => (
          <Key key={i} label={k} onClick={() => press(k)}
            className={k === "⌫" ? "bg-muted text-muted-foreground" : "bg-card border border-border"}
          />
        ))}
        <Key label="C" onClick={() => press("C")} className="col-span-3 bg-destructive/10 text-destructive" />
      </div>

      {/* Results */}
      {results && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 grid grid-cols-2 gap-2">
          {results.map(r => (
            <div key={r.label} className="text-center">
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="text-xl font-bold">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared key button ─────────────────────────────────────────────────────────
function Key({ label, onClick, className = "" }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`h-12 rounded-xl text-base font-medium flex items-center justify-center active:opacity-70 transition-opacity ${className}`}
    >
      {label === "⌫" ? <Delete className="w-4 h-4" /> : label}
    </motion.button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ConstructionCalculator() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("standard");

  const ModeCalc = { standard: StandardCalc, concrete: ConcreteCalc, flooring: FlooringCalc, roofing: RoofingCalc }[mode];

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Open calculator"
      >
        <Calculator className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-xl flex flex-col"
              style={{ paddingBottom: "env(safe-area-inset-bottom)", maxHeight: "90vh" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2 shrink-0">
                <h2 className="font-bold text-base flex items-center gap-2"><Calculator className="w-4 h-4" /> Construction Calculator</h2>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-2 px-4 pb-3 shrink-0 overflow-x-auto">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Calculator body */}
              <div className="px-4 pb-4 overflow-y-auto">
                <ModeCalc />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}