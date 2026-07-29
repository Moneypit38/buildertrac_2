import { useState, useReducer } from "react";
import { Calculator, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round(n, d = 8) {
  return parseFloat(n.toFixed(d));
}

// Format a value in decimal inches → feet′ inches″ fractions
function fmtFtIn(inches) {
  if (!isFinite(inches)) return "Error";
  const neg = inches < 0;
  const abs = Math.abs(inches);
  const ft = Math.floor(abs / 12);
  const remIn = abs - ft * 12;
  const wholeIn = Math.floor(remIn);
  const frac = remIn - wholeIn;
  const sixteenths = Math.round(frac * 16);
  let inStr = "";
  if (sixteenths === 16) {
    inStr = `${wholeIn + 1}"`;
  } else if (sixteenths > 0) {
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const g = gcd(sixteenths, 16);
    inStr = `${wholeIn} ${sixteenths / g}⁄${16 / g}"`;
  } else {
    inStr = wholeIn > 0 ? `${wholeIn}"` : "";
  }
  const prefix = neg ? "-" : "";
  if (ft && inStr) return `${prefix}${ft}′ ${inStr}`;
  if (ft) return `${prefix}${ft}′`;
  if (inStr) return `${prefix}${inStr}`;
  return `0"`;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const INIT = {
  display: "0",      // raw number string shown in display
  formula: "",       // top-line formula hint
  pending: null,     // { val, op }
  justEvaled: false,
  mem: 0,
  // dimension accumulator: null | { ft, inStr }
  dimMode: null,     // 'FT_ENTRY' | 'IN_ENTRY' (for feet-inch entry flow)
  ftVal: null,       // feet part while in IN_ENTRY mode
};

function calc(a, op, b) {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return b === 0 ? null : a / b;
  return b;
}

function reducer(state, action) {
  const { type, payload } = action;
  const cur = parseFloat(state.display);
  const safeNum = isFinite(cur) ? cur : 0;

  switch (type) {
    case "DIGIT": {
      if (state.justEvaled) {
        return { ...state, display: payload, formula: "", justEvaled: false };
      }
      const next = state.display === "0" ? payload : state.display + payload;
      return { ...state, display: next };
    }
    case "DOT": {
      if (state.display.includes(".")) return state;
      return { ...state, display: state.display + "." };
    }
    case "BACKSPACE": {
      const d = state.display.length > 1 ? state.display.slice(0, -1) : "0";
      return { ...state, display: d };
    }
    case "CLEAR":
      return { ...INIT, mem: state.mem };
    case "ALL_CLEAR":
      return INIT;
    case "SIGN":
      return { ...state, display: String(safeNum * -1) };
    case "PCT": {
      const base = state.pending ? state.pending.val : 0;
      const result = state.pending ? base * (safeNum / 100) : safeNum / 100;
      return { ...state, display: String(round(result)), justEvaled: true };
    }

    case "OP": {
      const op = payload;
      if (state.pending && !state.justEvaled) {
        const result = calc(state.pending.val, state.pending.op, safeNum);
        if (result === null) return { ...state, display: "Error", pending: null, formula: "Div/0", justEvaled: true };
        return { ...state, display: String(round(result)), formula: `${round(result)} ${op}`, pending: { val: round(result), op }, justEvaled: true };
      }
      return { ...state, pending: { val: safeNum, op }, formula: `${state.display} ${op}`, justEvaled: true };
    }

    case "EQUALS": {
      if (!state.pending) return state;
      const result = calc(state.pending.val, state.pending.op, safeNum);
      if (result === null) return { ...state, display: "Error", pending: null, formula: "Cannot divide by zero", justEvaled: true };
      return { ...state, display: String(round(result)), formula: `${state.pending.val} ${state.pending.op} ${state.display} =`, pending: null, justEvaled: true };
    }

    // ── Math fns ──
    case "SQ":    return { ...state, display: String(round(safeNum * safeNum)), formula: `${safeNum}²`, justEvaled: true };
    case "SQRT": {
      if (safeNum < 0) return { ...state, display: "Error", formula: "√ of negative", justEvaled: true };
      return { ...state, display: String(round(Math.sqrt(safeNum))), formula: `√${safeNum}`, justEvaled: true };
    }
    case "INV":   return safeNum === 0 ? { ...state, display: "Error", formula: "1/0" } : { ...state, display: String(round(1 / safeNum)), formula: `1/${safeNum}`, justEvaled: true };
    case "PI":    return { ...state, display: String(Math.PI), formula: "π", justEvaled: false };

    // ── Memory ──
    case "M_PLUS":  return { ...state, mem: state.mem + safeNum, formula: `M+ (${round(state.mem + safeNum, 4)})` };
    case "M_MINUS": return { ...state, mem: state.mem - safeNum, formula: `M− (${round(state.mem - safeNum, 4)})` };
    case "M_RCL":   return { ...state, display: String(state.mem), formula: `MR = ${state.mem}`, justEvaled: true };
    case "M_CLR":   return { ...state, mem: 0, formula: "Memory cleared" };

    // ── Dimension unit conversion ──
    case "UNIT_CONV": {
      const { from, label } = payload;
      // from = multiplier to convert current display value to feet
      const inFeet = safeNum * from;
      return { ...state, display: String(round(inFeet, 6)), formula: `${state.display} ${label} = ${round(inFeet, 4)} ft`, justEvaled: true };
    }

    // ── Construction specials ──
    case "PITCH_ANGLE": {
      // display = pitch (rise over 12 run), compute angle in degrees
      const angle = Math.atan(safeNum / 12) * (180 / Math.PI);
      const mult = Math.sqrt(1 + (safeNum / 12) ** 2);
      return { ...state, display: String(round(angle, 4)), formula: `${safeNum}/12 pitch → ${round(angle, 3)}° | mult: ${round(mult, 4)}`, justEvaled: true };
    }
    case "HYPO": {
      // diagonal of two legs — store first leg in mem, current = second leg
      const hyp = Math.sqrt(state.mem ** 2 + safeNum ** 2);
      return { ...state, display: String(round(hyp, 6)), formula: `√(${round(state.mem,4)}²+${round(safeNum,4)}²) = ${round(hyp,4)}`, justEvaled: true };
    }
    case "SQUAREUP": {
      // 3-4-5: given side, compute hypotenuse for layout
      const sq = Math.sqrt((safeNum * 3) ** 2 + (safeNum * 4) ** 2);
      return { ...state, display: String(round(sq, 6)), formula: `3-4-5 @ ${safeNum}: diag=${round(sq,4)}`, justEvaled: true };
    }
    case "CONCRETE": {
      // L × W × D (in ft, ft, in) → cubic yards
      // display must be depth in inches; mem = L×W product in sqft
      const sqft = state.mem;
      const depthFt = safeNum / 12;
      const cuft = sqft * depthFt;
      const cuyd = cuft / 27;
      return { ...state, display: String(round(cuyd, 4)), formula: `${round(sqft,2)} sqft × ${safeNum}" deep = ${round(cuyd,4)} cu yd`, justEvaled: true };
    }
    case "STUDS": {
      // wall length in ft, spacing 16" OC → stud count
      const spacing = 16 / 12; // feet
      const count = Math.ceil(safeNum / spacing) + 1;
      return { ...state, display: String(count), formula: `${safeNum}′ wall @ 16" OC = ${count} studs`, justEvaled: true };
    }
    case "STUDS24": {
      const spacing = 24 / 12;
      const count = Math.ceil(safeNum / spacing) + 1;
      return { ...state, display: String(count), formula: `${safeNum}′ wall @ 24" OC = ${count} studs`, justEvaled: true };
    }
    case "BLOCKS": {
      // area in sqft → standard 8×16 CMU blocks (+5% waste)
      const blocks = Math.ceil(safeNum / (8 * 16 / 144) * 1.05);
      return { ...state, display: String(blocks), formula: `${safeNum} sqft → ${blocks} blocks (8×16, +5%)`, justEvaled: true };
    }
    case "DRYWALL": {
      // area in sqft → 4×8 sheets (+10%)
      const sheets = Math.ceil(safeNum * 1.1 / 32);
      return { ...state, display: String(sheets), formula: `${safeNum} sqft → ${sheets} drywall sheets`, justEvaled: true };
    }
    case "BF": {
      // board feet: thickness(in) × width(in) × length(ft) / 12
      // simplified: value = thickness×width product, mem = length
      const bf = round(safeNum * state.mem / 12, 4);
      return { ...state, display: String(bf), formula: `${state.mem}′ × ${safeNum} sq.in = ${bf} BF`, justEvaled: true };
    }
    case "ROOFING": {
      // pitch stored in mem, area in sqft → roofing squares (+10%)
      const mult = Math.sqrt(1 + (state.mem / 12) ** 2);
      const actualSqft = safeNum * mult * 1.1;
      const squares = round(actualSqft / 100, 3);
      return { ...state, display: String(squares), formula: `${safeNum} sqft flat × mult(${round(mult,3)}) +10% = ${squares} squares`, justEvaled: true };
    }
    case "STAIR_RISE": {
      // display = total rise in inches → typical riser heights
      const ideal = safeNum / Math.round(safeNum / 7.5); // target 7.5"
      const count = Math.round(safeNum / 7.5);
      return { ...state, display: String(round(ideal, 4)), formula: `${safeNum}" rise ÷ ${count} risers = ${round(ideal,4)}" each`, justEvaled: true };
    }
    case "FMT_INCH": {
      // display decimal inches as ft′ in″ frac
      return { ...state, formula: `${safeNum}" = ${fmtFtIn(safeNum)}` };
    }
    case "FMT_FEET": {
      return { ...state, formula: `${safeNum}′ = ${fmtFtIn(safeNum * 12)}` };
    }

    default:
      return state;
  }
}

// ─── Key component ────────────────────────────────────────────────────────────

const THEMES = {
  num:     "bg-[#3a3a3c] active:bg-[#5a5a5c] text-white",
  op:      "bg-[#ff9f0a] active:bg-[#ffb340] text-white",
  fn:      "bg-[#2c2c2e] active:bg-[#4c4c4e] text-[#d1d1d6]",
  dim:     "bg-[#1c4a8f] active:bg-[#2a5faa] text-white",
  special: "bg-[#1b4332] active:bg-[#2d6a4f] text-[#d8f3dc]",
  clear:   "bg-[#8f1c1c] active:bg-[#aa2a2a] text-white",
  mem:     "bg-[#4a1c8f] active:bg-[#5f2aaa] text-white",
};

function Key({ label, sub, theme = "num", dispatch, action, wide }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onPointerDown={(e) => { e.preventDefault(); dispatch(action); }}
      className={`${THEMES[theme]} ${wide ? "col-span-2" : ""} rounded-2xl flex flex-col items-center justify-center gap-0.5 select-none touch-manipulation shadow-inner border border-white/5 w-full h-full`}
    >
      <span className="text-[15px] font-semibold leading-none">{label}</span>
      {sub && <span className="text-[9px] opacity-60 leading-none">{sub}</span>}
    </motion.button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ConstructionCalculator() {
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useReducer(reducer, INIT);

  const d = (type, payload) => dispatch({ type, payload });

  const displayNum = parseFloat(state.display);
  const isError = state.display === "Error";

  // Build the keypad: [label, sub-label, theme, action, wide?]
  // 5-column grid
  const keys = [
    // Row 0 — top fn
    ["AC",    "",          "clear",   { type: "ALL_CLEAR" }],
    ["C",     "Clear",     "clear",   { type: "CLEAR" }],
    ["⌫",    "Back",      "fn",      { type: "BACKSPACE" }],
    ["M+",   "Mem+",      "mem",     { type: "M_PLUS" }],
    ["MR",   "Recall",    "mem",     { type: "M_RCL" }],

    // Row 1 — math fns
    ["M−",   "Mem−",      "mem",     { type: "M_MINUS" }],
    ["MC",   "Mem Clr",   "mem",     { type: "M_CLR" }],
    ["x²",   "Square",    "fn",      { type: "SQ" }],
    ["√x",   "Sq Root",   "fn",      { type: "SQRT" }],
    ["1/x",  "Recip",     "fn",      { type: "INV" }],

    // Row 2 — unit conversions
    ["IN→FT","×0.0833",   "dim",     { type: "UNIT_CONV", payload: { from: 1/12, label: "in" } }],
    ["FT→IN","×12",       "dim",     { type: "UNIT_CONV", payload: { from: 12, label: "ft→in" } }],
    ["FT→YD","÷3",        "dim",     { type: "UNIT_CONV", payload: { from: 1/3, label: "ft→yd" } }],
    ["FT→M", "×0.3048",   "dim",     { type: "UNIT_CONV", payload: { from: 0.3048, label: "ft→m" } }],
    ["M→FT", "×3.2808",   "dim",     { type: "UNIT_CONV", payload: { from: 3.2808, label: "m→ft" } }],

    // Row 3 — construction
    ["PITCH","→ Angle",   "special", { type: "PITCH_ANGLE" }],
    ["DIAG", "A²+B²",     "special", { type: "HYPO" }],
    ["3-4-5","Sq Up",     "special", { type: "SQUAREUP" }],
    ["STUDS","16\" OC",   "special", { type: "STUDS" }],
    ["STUDS","24\" OC",   "special", { type: "STUDS24" }],

    // Row 4 — construction
    ["RISER","Stair Rise","special", { type: "STAIR_RISE" }],
    ["CONC", "Cu Yd",     "special", { type: "CONCRETE" }],
    ["ROOF", "Squares",   "special", { type: "ROOFING" }],
    ["BLOCK","8×16 CMU",  "special", { type: "BLOCKS" }],
    ["DRY",  "Drywall",   "special", { type: "DRYWALL" }],

    // Row 5 — format helpers
    ["FMT\"","In→Ft′In″", "fn",      { type: "FMT_INCH" }],
    ["FMT′","Ft→Ft′In″",  "fn",      { type: "FMT_FEET" }],
    ["π",    "3.14159",   "fn",      { type: "PI" }],
    ["+/-",  "Sign",      "fn",      { type: "SIGN" }],
    ["%",    "Percent",   "fn",      { type: "PCT" }],

    // Rows 6-9 — numeric + operators
    ["7",    "",          "num",     { type: "DIGIT", payload: "7" }],
    ["8",    "",          "num",     { type: "DIGIT", payload: "8" }],
    ["9",    "",          "num",     { type: "DIGIT", payload: "9" }],
    ["÷",    "",          "op",      { type: "OP", payload: "÷" }],
    ["BF",   "Bd Feet",   "special", { type: "BF" }],

    ["4",    "",          "num",     { type: "DIGIT", payload: "4" }],
    ["5",    "",          "num",     { type: "DIGIT", payload: "5" }],
    ["6",    "",          "num",     { type: "DIGIT", payload: "6" }],
    ["×",    "",          "op",      { type: "OP", payload: "×" }],
    ["M→", "Store→Mem",   "mem",     { type: "M_PLUS" }],

    ["1",    "",          "num",     { type: "DIGIT", payload: "1" }],
    ["2",    "",          "num",     { type: "DIGIT", payload: "2" }],
    ["3",    "",          "num",     { type: "DIGIT", payload: "3" }],
    ["-",    "",          "op",      { type: "OP", payload: "-" }],
    ["",     "",          "num",     null], // placeholder

    ["0",    "",          "num",     { type: "DIGIT", payload: "0" }],
    ["00",   "",          "num",     { type: "DIGIT", payload: "00" }],
    [".",    "Decimal",   "num",     { type: "DOT" }],
    ["+",    "",          "op",      { type: "OP", payload: "+" }],
    ["=",    "",          "op",      { type: "EQUALS" }],
  ];

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Calculator className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            style={{
              background: "#000",
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
              <span className="text-xs font-bold tracking-widest text-[#ff9f0a] uppercase">Construction Master</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-[#2c2c2e] flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display */}
            <div className="px-4 pb-3 flex-shrink-0">
              <div className="bg-[#1c1c1e] rounded-2xl px-5 py-4 border border-white/10">
                <p className="text-[11px] text-[#ff9f0a] font-mono min-h-[16px] truncate">
                  {state.formula || (state.mem !== 0 ? `M: ${round(state.mem, 4)}` : "\u00A0")}
                </p>
                <p className={`text-right font-light font-mono mt-1 truncate ${isError ? "text-red-400 text-3xl" : "text-white text-4xl"}`}>
                  {state.display}
                </p>
              </div>
            </div>

            {/* Keypad */}
            <div className="flex-1 px-3 pb-3 overflow-hidden">
              <div className="grid grid-cols-5 gap-1.5 h-full"
                style={{ gridTemplateRows: "repeat(9, 1fr)" }}>
                {keys.map((k, i) => {
                  const [label, sub, theme, action] = k;
                  if (!label && !action) return <div key={i} />;
                  return (
                    <Key
                      key={i}
                      label={label}
                      sub={sub}
                      theme={theme}
                      dispatch={dispatch}
                      action={action}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}