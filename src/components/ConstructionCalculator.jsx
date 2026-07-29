import { useState, useCallback } from "react";
import { Calculator, X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Feet-Inch-Fraction display formatter ────────────────────────────────────
function toFeetInchFrac(inches) {
  if (isNaN(inches) || inches === null) return "0";
  const neg = inches < 0;
  const abs = Math.abs(inches);
  const ft = Math.floor(abs / 12);
  const inPart = abs % 12;
  const inInt = Math.floor(inPart);
  const frac = inPart - inInt;
  // find nearest 1/16
  const sixteenths = Math.round(frac * 16);
  let fracStr = "";
  if (sixteenths > 0 && sixteenths < 16) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const num = sixteenths, den = 16;
    const g = gcd(num, den);
    fracStr = ` ${num/g}/${den/g}"`;
  } else if (sixteenths === 16) {
    // round up
  }
  const inStr = (inInt > 0 || sixteenths > 0) ? `${inInt}${fracStr}"` : "";
  if (ft > 0 && inStr) return `${neg?"-":""}${ft}' ${inStr}`;
  if (ft > 0) return `${neg?"-":""}${ft}'`;
  if (inStr) return `${neg?"-":""}${inStr}`;
  return "0";
}

function formatDisplay(val, unit) {
  if (val === "Error") return "Error";
  const num = parseFloat(val);
  if (isNaN(num)) return val || "0";
  if (unit === "FT") return toFeetInchFrac(num * 12);
  if (unit === "IN") return toFeetInchFrac(num);
  if (unit === "YD") return `${parseFloat(num.toFixed(6))} yd`;
  if (unit === "M")  return `${parseFloat(num.toFixed(6))} m`;
  if (unit === "CM") return `${parseFloat(num.toFixed(4))} cm`;
  if (unit === "MM") return `${parseFloat(num.toFixed(2))} mm`;
  return parseFloat(num.toFixed(8)).toString();
}

// ─── Main calculator state machine ───────────────────────────────────────────
function useCalcState() {
  const [display, setDisplay]     = useState("0");
  const [subDisplay, setSubDisplay] = useState("");
  const [entry, setEntry]         = useState(""); // raw string being typed
  const [prev, setPrev]           = useState(null);
  const [op, setOp]               = useState(null);
  const [unit, setUnit]           = useState(null); // last dimension unit
  const [memory, setMemory]       = useState(0);
  const [freshEntry, setFreshEntry] = useState(false);
  const [inchAcc, setInchAcc]     = useState(null); // for feet→inch→frac entry
  const [entryPhase, setEntryPhase] = useState("whole"); // whole | frac

  const currentVal = () => {
    const n = parseFloat(display);
    return isNaN(n) ? 0 : n;
  };

  const applyOp = (a, operator, b) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? null : a / b;
      default: return b;
    }
  };

  const commitEntry = useCallback(() => {
    const n = parseFloat(display);
    return isNaN(n) ? 0 : n;
  }, [display]);

  const press = useCallback((key) => {
    // ── Digits and decimal ─────────────────────────────────────────────
    if (/^[0-9]$/.test(key) || key === ".") {
      setDisplay(prev => {
        if (freshEntry) { setFreshEntry(false); return key === "." ? "0." : key; }
        if (prev === "0" && key !== ".") return key;
        if (key === "." && prev.includes(".")) return prev;
        return prev + key;
      });
      setSubDisplay("");
      return;
    }

    // ── Backspace ──────────────────────────────────────────────────────
    if (key === "⌫") {
      setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0");
      return;
    }

    // ── Clear ──────────────────────────────────────────────────────────
    if (key === "C") {
      setDisplay("0"); setPrev(null); setOp(null); setSubDisplay(""); setFreshEntry(false); setUnit(null);
      return;
    }
    if (key === "CA") {
      setDisplay("0"); setPrev(null); setOp(null); setSubDisplay(""); setFreshEntry(false); setUnit(null); setMemory(0);
      return;
    }

    // ── Sign toggle ────────────────────────────────────────────────────
    if (key === "+/-") {
      setDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? "0" : "-" + d);
      return;
    }

    // ── Percent ────────────────────────────────────────────────────────
    if (key === "%") {
      const base = prev !== null ? prev : 0;
      const pct = parseFloat(display) / 100;
      const result = op ? base * pct : pct;
      setDisplay(String(parseFloat(result.toFixed(10))));
      setSubDisplay(""); setFreshEntry(true);
      return;
    }

    // ── Square / Square root ───────────────────────────────────────────
    if (key === "x²") {
      const v = currentVal();
      setDisplay(String(parseFloat((v * v).toFixed(10))));
      setFreshEntry(true); return;
    }
    if (key === "√") {
      const v = currentVal();
      if (v < 0) { setDisplay("Error"); return; }
      setDisplay(String(parseFloat(Math.sqrt(v).toFixed(10))));
      setFreshEntry(true); return;
    }
    if (key === "1/x") {
      const v = currentVal();
      if (v === 0) { setDisplay("Error"); return; }
      setDisplay(String(parseFloat((1/v).toFixed(10))));
      setFreshEntry(true); return;
    }

    // ── Memory ────────────────────────────────────────────────────────
    if (key === "M+") { setMemory(m => m + currentVal()); setSubDisplay("M+"); setFreshEntry(true); return; }
    if (key === "M-") { setMemory(m => m - currentVal()); setSubDisplay("M−"); setFreshEntry(true); return; }
    if (key === "MR") { setDisplay(String(memory)); setFreshEntry(true); setSubDisplay("MR"); return; }
    if (key === "MC") { setMemory(0); setSubDisplay("MC"); return; }

    // ── Dimension unit keys ───────────────────────────────────────────
    // Store value internally in INCHES for dimension math
    const dimKeys = { "FEET": "FT", "INCH": "IN", "YD": "YD", "M": "M", "CM": "CM", "MM": "MM" };
    if (dimKeys[key]) {
      const u = dimKeys[key];
      const val = parseFloat(display);
      // Convert to internal inches
      const toInches = { FT: v => v * 12, IN: v => v, YD: v => v * 36, M: v => v * 39.3701, CM: v => v * 0.393701, MM: v => v * 0.0393701 };
      const inInches = toInches[u](isNaN(val) ? 0 : val);
      setUnit(u);
      setDisplay(String(parseFloat(inInches.toFixed(8))));
      setSubDisplay(formatDisplay(inInches / 12, "FT"));
      setFreshEntry(true);
      return;
    }

    // ── Convert ───────────────────────────────────────────────────────
    if (key === "→FT") { const v = currentVal(); setDisplay(String(parseFloat((v/12).toFixed(8)))); setUnit("FT"); setSubDisplay(formatDisplay(v/12,"FT")); setFreshEntry(true); return; }
    if (key === "→IN") { setUnit("IN"); setSubDisplay(formatDisplay(currentVal(),"IN")); setFreshEntry(true); return; }
    if (key === "→M")  { const v = currentVal(); setDisplay(String(parseFloat((v*0.0254).toFixed(8)))); setUnit("M"); setSubDisplay(formatDisplay(v*0.0254,"M")); setFreshEntry(true); return; }

    // ── Area (sq ft when no unit, or auto from inches²) ──────────────
    if (key === "AREA") {
      // Expects value already in inches; area = val²/144 sq ft
      const v = currentVal();
      const sqft = (v * v) / 144;
      setDisplay(String(parseFloat(sqft.toFixed(6))));
      setSubDisplay(`${parseFloat(sqft.toFixed(4))} sq ft`);
      setFreshEntry(true); return;
    }

    // ── Volume ────────────────────────────────────────────────────────
    if (key === "VOL") {
      const v = currentVal();
      const cuft = (v * v * v) / 1728;
      const cuyd = cuft / 27;
      setDisplay(String(parseFloat(cuyd.toFixed(6))));
      setSubDisplay(`${parseFloat(cuft.toFixed(4))} cu ft = ${parseFloat(cuyd.toFixed(4))} cu yd`);
      setFreshEntry(true); return;
    }

    // ── Stair layout (Rise / Run) ──────────────────────────────────────
    if (key === "RISE") {
      // store rise in memory slot
      setMemory(currentVal());
      setSubDisplay("Rise stored");
      setFreshEntry(true); return;
    }
    if (key === "RUN") {
      const rise = memory;
      const run  = currentVal();
      if (run === 0) return;
      const angle = Math.atan2(rise, run) * (180 / Math.PI);
      const slope = (rise / run * 12); // inches per foot
      setDisplay(String(parseFloat(angle.toFixed(4))));
      setSubDisplay(`Pitch: ${parseFloat(slope.toFixed(4))}"/ft  Angle: ${parseFloat(angle.toFixed(2))}°`);
      setFreshEntry(true); return;
    }

    // ── Pitch / Roof slope ────────────────────────────────────────────
    if (key === "PITCH") {
      // value is pitch in x/12; compute angle
      const p = currentVal();
      const angle = Math.atan(p / 12) * (180 / Math.PI);
      setSubDisplay(`Angle: ${parseFloat(angle.toFixed(3))}°  Mult: ${parseFloat(Math.sqrt(1+(p/12)**2).toFixed(4))}`);
      setFreshEntry(true); return;
    }

    // ── Hypotenuse (Diagonal) ─────────────────────────────────────────
    if (key === "DIAG") {
      // prev = side A (stored via M+), current = side B
      const a = memory;
      const b = currentVal();
      const hyp = Math.sqrt(a*a + b*b);
      setDisplay(String(parseFloat(hyp.toFixed(8))));
      setSubDisplay(`Diagonal: ${toFeetInchFrac(hyp)}`);
      setFreshEntry(true); return;
    }

    // ── Concrete volume (L×W×D in inches → cu yd) ──────────────────
    if (key === "CONC") {
      // expects user to have entered length×width×depth in inches via × key
      // Here we just show cu yd from whatever is in display (treated as cu in)
      const cuIn = currentVal();
      const cuYd = cuIn / 46656;
      setDisplay(String(parseFloat(cuYd.toFixed(6))));
      setSubDisplay(`${parseFloat(cuYd.toFixed(4))} cu yd  (${parseFloat((cuYd*27).toFixed(4))} cu ft)`);
      setFreshEntry(true); return;
    }

    // ── Board feet ────────────────────────────────────────────────────
    if (key === "BF") {
      // value should be thickness×width×length in inches  → bd ft = /144
      const cuIn = currentVal();
      const bf = cuIn / 144;
      setDisplay(String(parseFloat(bf.toFixed(4))));
      setSubDisplay(`${parseFloat(bf.toFixed(2))} board feet`);
      setFreshEntry(true); return;
    }

    // ── Studs ─────────────────────────────────────────────────────────
    if (key === "STUDS") {
      // value = wall length in inches, spacing = 16" o.c.
      const len = currentVal();
      const spacing = memory > 0 ? memory : 16;
      const count = Math.ceil(len / spacing) + 1;
      setDisplay(String(count));
      setSubDisplay(`${count} studs @ ${spacing}" o.c.`);
      setFreshEntry(true); return;
    }

    // ── Blocks ────────────────────────────────────────────────────────
    if (key === "BLOCK") {
      // value = area in sq inches; standard block = 128 sq in face
      const area = currentVal();
      const blocks = Math.ceil(area / 128 * 1.05); // +5% waste
      setDisplay(String(blocks));
      setSubDisplay(`${blocks} blocks (8"×16", +5% waste)`);
      setFreshEntry(true); return;
    }

    // ── Drywall sheets ────────────────────────────────────────────────
    if (key === "DRY") {
      // area in sq ft → 4×8 sheets
      const sqft = currentVal();
      const sheets = Math.ceil(sqft * 1.1 / 32);
      setDisplay(String(sheets));
      setSubDisplay(`${sheets} sheets (4×8, +10% waste)`);
      setFreshEntry(true); return;
    }

    // ── π ─────────────────────────────────────────────────────────────
    if (key === "π") {
      setDisplay(String(Math.PI));
      setFreshEntry(true); return;
    }

    // ── Arithmetic operators ──────────────────────────────────────────
    if (["+", "-", "×", "÷"].includes(key)) {
      const cur = currentVal();
      if (op && prev !== null && !freshEntry) {
        const res = applyOp(prev, op, cur);
        if (res === null) { setDisplay("Error"); setOp(null); setPrev(null); return; }
        setDisplay(String(parseFloat(res.toFixed(10))));
        setPrev(parseFloat(res.toFixed(10)));
      } else {
        setPrev(cur);
      }
      setOp(key);
      setSubDisplay(`${formatDisplay(currentVal(), unit)} ${key}`);
      setFreshEntry(true);
      return;
    }

    // ── Equals ────────────────────────────────────────────────────────
    if (key === "=") {
      if (op && prev !== null) {
        const cur = currentVal();
        const res = applyOp(prev, op, cur);
        if (res === null) { setDisplay("Error"); setOp(null); setPrev(null); setSubDisplay("Div/0"); return; }
        const clean = parseFloat(res.toFixed(10));
        setDisplay(String(clean));
        setSubDisplay(unit ? formatDisplay(clean / (unit === "FT" ? 12 : 1), unit) : "");
        setPrev(null); setOp(null); setFreshEntry(true);
      }
      return;
    }
  }, [display, prev, op, unit, memory, freshEntry]);

  return { display, subDisplay, unit, memory, press };
}

// ─── Key button ───────────────────────────────────────────────────────────────
function Key({ label, sub, onClick, color = "default", wide = false, tall = false }) {
  const colors = {
    default:  "bg-zinc-700 active:bg-zinc-600 text-white",
    fn:       "bg-zinc-600 active:bg-zinc-500 text-zinc-200",
    op:       "bg-amber-500 active:bg-amber-400 text-white",
    dim:      "bg-blue-700 active:bg-blue-600 text-white",
    special:  "bg-teal-700 active:bg-teal-600 text-white",
    clear:    "bg-red-700 active:bg-red-600 text-white",
    eq:       "bg-amber-500 active:bg-amber-400 text-white",
    mem:      "bg-purple-700 active:bg-purple-600 text-white",
    dark:     "bg-zinc-800 active:bg-zinc-700 text-zinc-300",
  };
  return (
    <motion.button
      whileTap={{ scale: 0.88, opacity: 0.8 }}
      onClick={onClick}
      className={`${colors[color]} ${wide ? "col-span-2" : ""} ${tall ? "row-span-2" : ""} rounded-xl flex flex-col items-center justify-center select-none touch-manipulation shadow-sm border border-white/5`}
      style={{ minHeight: tall ? "5rem" : "2.5rem" }}
    >
      <span className="text-sm font-semibold leading-none">{label}</span>
      {sub && <span className="text-[9px] text-white/60 mt-0.5 leading-none">{sub}</span>}
    </motion.button>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function ConstructionCalculator() {
  const [open, setOpen] = useState(false);
  const { display, subDisplay, unit, memory, press } = useCalcState();

  // Construction Master Pro–style layout
  // Row order: top fn row, dim row, special, numeric+ops
  const rows = [
    // Top utility row
    [
      { label: "CA",    sub: "All Clear",  color: "clear"   },
      { label: "C",     sub: "Clear",      color: "clear"   },
      { label: "⌫",    sub: "Back",       color: "fn"      },
      { label: "M+",   sub: "Mem+",       color: "mem"     },
      { label: "M-",   sub: "Mem−",       color: "mem"     },
    ],
    // Memory row
    [
      { label: "MR",   sub: "Recall",     color: "mem"     },
      { label: "MC",   sub: "Mem Clr",    color: "mem"     },
      { label: "π",    sub: "Pi",         color: "fn"      },
      { label: "x²",   sub: "Square",     color: "fn"      },
      { label: "√",    sub: "Sq Root",    color: "fn"      },
    ],
    // Dimension unit row
    [
      { label: "FEET",  sub: "ft",         color: "dim"     },
      { label: "INCH",  sub: "in",         color: "dim"     },
      { label: "YD",   sub: "yards",      color: "dim"     },
      { label: "M",    sub: "meters",     color: "dim"     },
      { label: "CM",   sub: "cm",         color: "dim"     },
    ],
    // Construction functions row 1
    [
      { label: "PITCH", sub: "Slope",      color: "special" },
      { label: "RISE",  sub: "Store Rise", color: "special" },
      { label: "RUN",   sub: "Calc Run",   color: "special" },
      { label: "DIAG",  sub: "Diagonal",   color: "special" },
      { label: "AREA",  sub: "Sq Ft",      color: "special" },
    ],
    // Construction functions row 2
    [
      { label: "VOL",   sub: "Cu Yd",      color: "special" },
      { label: "CONC",  sub: "Concrete",   color: "special" },
      { label: "STUDS", sub: "16\" o.c.",  color: "special" },
      { label: "BLOCK", sub: "8×16",       color: "special" },
      { label: "DRY",   sub: "Drywall",    color: "special" },
    ],
    // Numeric + ops rows
    [
      { label: "7",    color: "default"  },
      { label: "8",    color: "default"  },
      { label: "9",    color: "default"  },
      { label: "÷",    color: "op"       },
      { label: "1/x",  sub: "Reciprocal",color: "fn"       },
    ],
    [
      { label: "4",    color: "default"  },
      { label: "5",    color: "default"  },
      { label: "6",    color: "default"  },
      { label: "×",    color: "op"       },
      { label: "BF",   sub: "Bd Ft",     color: "special"  },
    ],
    [
      { label: "1",    color: "default"  },
      { label: "2",    color: "default"  },
      { label: "3",    color: "default"  },
      { label: "-",    color: "op"       },
      { label: "%",    sub: "Percent",   color: "fn"       },
    ],
    [
      { label: "+/-",  sub: "Sign",      color: "fn"       },
      { label: "0",    color: "default"  },
      { label: ".",    sub: "Decimal",   color: "default"  },
      { label: "+",    color: "op"       },
      { label: "=",    color: "eq"       },
    ],
  ];

  return (
    <>
      {/* Floating button */}
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
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: "#1a1a1a", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Construction Master</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display */}
            <div className="bg-zinc-900 mx-3 mt-3 rounded-xl px-4 py-3 border border-white/10 flex-shrink-0">
              {subDisplay ? (
                <p className="text-xs text-amber-400 font-mono truncate min-h-[16px]">{subDisplay}</p>
              ) : (
                <p className="text-xs text-zinc-600 min-h-[16px]">{unit ? `Unit: ${unit}` : memory !== 0 ? `M: ${parseFloat(memory.toFixed(4))}` : ""}</p>
              )}
              <p className="text-4xl font-light text-white tracking-tight text-right mt-1 truncate font-mono">
                {display === "Error" ? <span className="text-red-400">Error</span> : display}
              </p>
            </div>

            {/* Keypad — fill remaining space */}
            <div className="flex-1 px-3 py-2 overflow-hidden flex flex-col gap-1.5">
              {rows.map((row, ri) => (
                <div key={ri} className="flex gap-1.5 flex-1">
                  {row.map((k, ki) => (
                    <div key={ki} className="flex-1">
                      <Key
                        label={k.label}
                        sub={k.sub}
                        color={k.color}
                        onClick={() => press(k.label)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Tip bar */}
            <div className="px-4 pb-2 text-center">
              <p className="text-[10px] text-zinc-600">FEET/INCH/YD/M = enter value then press unit key • RISE then RUN = stair angle • M+ stores value for DIAG/STUDS</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}