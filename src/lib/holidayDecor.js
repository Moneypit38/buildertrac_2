// Holiday decoration for the app: a faint tiled background pattern, a thin
// strip under the header, and (see components/HolidayOrnament.jsx) a small
// ornament next to the logo. Everything is drawn with inline SVG / CSS
// gradients, so there are no image files to download.
//
// Decoration is applied through three CSS variables on <html>:
//   --decor-bg       url(...) tiled behind the whole app
//   --decor-strip    gradient shown as a thin strip along the bottom of the header
//   --decor-strip-h  height of that strip

// Month/day windows (MMDD) in which each holiday look switches on by itself.
const WINDOWS = [
  { id: "halloween", from: 1015, to: 1101 },
  { id: "thanksgiving", from: 1114, to: 1130 },
  { id: "christmas", from: 1201, to: 1228 },
  { id: "newyear", from: 1229, to: 1231 },
  { id: "newyear", from: 101, to: 103 },
  { id: "fourth", from: 625, to: 706 },
];

export function getActiveHolidayId(date = new Date()) {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  const hit = WINDOWS.find((w) => md >= w.from && md <= w.to);
  return hit ? hit.id : null;
}

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${body}</svg>`;

const LEAF = "M0-14C9-8 9 6 0 14C-9 6-9-8 0-14Z";
const SPARKLE = "M0-6L1.6-1.6L6 0L1.6 1.6L0 6L-1.6 1.6L-6 0L-1.6-1.6Z";
const STAR = "M0-7L2-2.2L7-2.2L3 1L4.5 6L0 3.2L-4.5 6L-3 1L-7-2.2L-2-2.2Z";
const FLAKE = "M-7 0H7M-3.5-6L3.5 6M-3.5 6L3.5-6";

const DECOR = {
  thanksgiving: {
    tile: svg(
      `<g fill="#b3590f" fill-opacity=".10"><path transform="translate(22 26) rotate(30)" d="${LEAF}"/><path transform="translate(88 70) rotate(-40)" d="${LEAF}"/></g>` +
        `<g fill="#ca8a04" fill-opacity=".11"><path transform="translate(70 22) rotate(75)" d="${LEAF}"/><path transform="translate(30 92) rotate(-15)" d="${LEAF}"/></g>` +
        `<g fill="#92400e" fill-opacity=".09"><path transform="translate(104 108) rotate(50)" d="${LEAF}"/></g>`
    ),
    strip: "linear-gradient(90deg,#92400e,#b3590f,#ca8a04,#b3590f,#92400e)",
  },
  christmas: {
    tile: svg(
      `<g stroke="#94a3b8" stroke-opacity=".25" stroke-width="1.5" stroke-linecap="round" fill="none">` +
        `<path transform="translate(24 26)" d="${FLAKE}"/><path transform="translate(84 64)" d="${FLAKE}"/><path transform="translate(40 98)" d="${FLAKE}"/></g>` +
        `<circle cx="78" cy="22" r="2.4" fill="#c8102e" fill-opacity=".20"/><circle cx="104" cy="104" r="2.4" fill="#16a34a" fill-opacity=".20"/><circle cx="12" cy="64" r="2" fill="#16a34a" fill-opacity=".18"/>`
    ),
    strip: "repeating-linear-gradient(135deg,#c8102e 0 10px,#f8fafc 10px 20px,#0f5132 20px 30px,#f8fafc 30px 40px)",
  },
  halloween: {
    tile: svg(
      `<g fill="#7c3aed" fill-opacity=".14"><path transform="translate(26 28)" d="${SPARKLE}"/><path transform="translate(90 84)" d="${SPARKLE}"/></g>` +
        `<g fill="#f97316" fill-opacity=".16"><circle cx="84" cy="24" r="3.2"/><circle cx="30" cy="90" r="3.2"/><circle cx="58" cy="58" r="2"/></g>`
    ),
    strip: "linear-gradient(90deg,#f97316,#7c3aed,#f97316)",
  },
  newyear: {
    tile: svg(
      `<g fill="#d4af37" fill-opacity=".20"><path transform="translate(26 26)" d="${SPARKLE}"/><path transform="translate(88 78)" d="${SPARKLE}"/><circle cx="76" cy="22" r="2.4"/><circle cx="22" cy="86" r="2.4"/></g>` +
        `<g fill="#6366f1" fill-opacity=".16"><circle cx="56" cy="60" r="2.6"/><circle cx="104" cy="30" r="2.2"/><circle cx="62" cy="106" r="2.2"/></g>`
    ),
    strip: "linear-gradient(90deg,#1e293b,#d4af37,#6366f1,#d4af37,#1e293b)",
  },
  fourth: {
    tile: svg(
      `<g fill="#b22234" fill-opacity=".10"><path transform="translate(26 28)" d="${STAR}"/><path transform="translate(90 86)" d="${STAR}"/></g>` +
        `<g fill="#3c3b6e" fill-opacity=".11"><path transform="translate(86 26)" d="${STAR}"/><path transform="translate(30 90)" d="${STAR}"/></g>`
    ),
    strip: "linear-gradient(90deg,#b22234 0 33%,#f8fafc 33% 66%,#3c3b6e 66% 100%)",
  },
};

const VARS = ["--decor-bg", "--decor-strip", "--decor-strip-h"];

export function applyDecor(root, holidayId) {
  const d = holidayId ? DECOR[holidayId] : null;
  if (!d) {
    VARS.forEach((k) => root.style.removeProperty(k));
    return;
  }
  root.style.setProperty("--decor-bg", `url("data:image/svg+xml,${encodeURIComponent(d.tile)}")`);
  root.style.setProperty("--decor-strip", d.strip);
  root.style.setProperty("--decor-strip-h", "5px");
}
