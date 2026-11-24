// Holiday decoration for the app: a faint tiled background of illustrations, a
// thin strip under the header, and (see components/HolidayOrnament.jsx) a
// small illustration next to the logo. The drawings live in holidayArt.js and
// are inline SVG, so there are no image files to download.
//
// Decoration is applied through three CSS variables on <html>:
//   --decor-bg       url(...) tiled behind the whole app
//   --decor-strip    gradient shown as a thin strip along the bottom of the header
//   --decor-strip-h  height of that strip
import { buildTile } from "./holidayArt";

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

const STRIPS = {
  thanksgiving: "linear-gradient(90deg,#92400e,#b3590f,#ca8a04,#b3590f,#92400e)",
  christmas: "repeating-linear-gradient(135deg,#c8102e 0 10px,#f8fafc 10px 20px,#0f5132 20px 30px,#f8fafc 30px 40px)",
  halloween: "linear-gradient(90deg,#f97316,#7c3aed,#f97316)",
  newyear: "linear-gradient(90deg,#1e293b,#d4af37,#6366f1,#d4af37,#1e293b)",
  fourth: "linear-gradient(90deg,#b22234 0 33%,#f8fafc 33% 66%,#3c3b6e 66% 100%)",
};

const VARS = ["--decor-bg", "--decor-strip", "--decor-strip-h"];

export function applyDecor(root, holidayId) {
  const strip = holidayId ? STRIPS[holidayId] : null;
  if (!strip) {
    VARS.forEach((k) => root.style.removeProperty(k));
    return;
  }
  root.style.setProperty("--decor-bg", `url("data:image/svg+xml,${encodeURIComponent(buildTile(holidayId))}")`);
  root.style.setProperty("--decor-strip", strip);
  root.style.setProperty("--decor-strip-h", "5px");
}
