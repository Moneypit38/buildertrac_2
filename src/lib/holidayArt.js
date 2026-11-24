// Original holiday illustrations. Every drawing lives in a 64 x 64 box.
// Each value is the inside of an <svg viewBox="0 0 64 64"> element.
export const ART = {
  tree: `
  <rect x="27" y="51" width="10" height="9" rx="1.5" fill="#6b4423"/>
  <g stroke-linejoin="round" stroke-width="3">
    <polygon points="32,24 9,55 55,55" fill="#17703a" stroke="#17703a"/>
    <polygon points="32,13 14,41 50,41" fill="#228b4a" stroke="#228b4a"/>
    <polygon points="32,5 19,27 45,27" fill="#2fa65a" stroke="#2fa65a"/>
  </g>
  <path d="M15 46 Q32 38 49 46" stroke="#f5d76e" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray="0.1 4"/>
  <path d="M20 33 Q32 27 44 33" stroke="#f5d76e" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray="0.1 4"/>
  <circle cx="22" cy="49" r="3" fill="#e63946"/>
  <circle cx="41" cy="50" r="3" fill="#f4b400"/>
  <circle cx="30" cy="39" r="2.8" fill="#4361ee"/>
  <circle cx="39" cy="32" r="2.6" fill="#e63946"/>
  <circle cx="27" cy="22" r="2.4" fill="#f4b400"/>
  <path d="M32 0.5l2.1 4.2 4.6.7-3.4 3.2.8 4.6L32 11l-4.1 2.2.8-4.6-3.4-3.2 4.6-.7z" fill="#ffd23f" stroke="#e0a800" stroke-width=".6" stroke-linejoin="round"/>`,

  hat: `
  <path d="M10 50 C9 26 22 12 40 12 C47 12 52 15 53 21 C46 21 44 29 47 38 C48 42 50 46 53 50 Z" fill="#d62839"/>
  <path d="M10 50 C9 34 14 22 24 16 C20 28 20 40 24 50 Z" fill="#b01e2e" opacity=".55"/>
  <rect x="5" y="46" width="54" height="13" rx="6.5" fill="#fdfdfd" stroke="#c9d1dc" stroke-width="1.6"/>
  <circle cx="53" cy="17" r="7" fill="#fdfdfd" stroke="#c9d1dc" stroke-width="1.6"/>`,

  turkey: `
  <g transform="translate(32 44)">
    <ellipse cx="0" cy="-22" rx="6.5" ry="14" fill="#b3380f" transform="rotate(-64)"/>
    <ellipse cx="0" cy="-22" rx="6.5" ry="14" fill="#d9640d" transform="rotate(-32)"/>
    <ellipse cx="0" cy="-23" rx="6.5" ry="14" fill="#e8a317"/>
    <ellipse cx="0" cy="-22" rx="6.5" ry="14" fill="#d9640d" transform="rotate(32)"/>
    <ellipse cx="0" cy="-22" rx="6.5" ry="14" fill="#b3380f" transform="rotate(64)"/>
    <g fill="#fff3d6" opacity=".55">
      <ellipse cx="0" cy="-24" rx="2.4" ry="8" transform="rotate(-64)"/>
      <ellipse cx="0" cy="-24" rx="2.4" ry="8" transform="rotate(-32)"/>
      <ellipse cx="0" cy="-25" rx="2.4" ry="8"/>
      <ellipse cx="0" cy="-24" rx="2.4" ry="8" transform="rotate(32)"/>
      <ellipse cx="0" cy="-24" rx="2.4" ry="8" transform="rotate(64)"/>
    </g>
  </g>
  <path d="M27 58 v4 M37 58 v4 M24 62 h6 M34 62 h6" stroke="#e8a317" stroke-width="2" stroke-linecap="round" fill="none"/>
  <ellipse cx="32" cy="47" rx="13" ry="12.5" fill="#7a4a2a"/>
  <ellipse cx="32" cy="50" rx="8" ry="7" fill="#946036"/>
  <circle cx="32" cy="31" r="7.5" fill="#7a4a2a"/>
  <path d="M30.5 33 l-1.2 7 c0 2.2 3.4 2.2 3.4 0 l-.6-5.2z" fill="#d62839"/>
  <path d="M32 31.5 l5.5 2.2 -5.5 2.2z" fill="#f4a300"/>
  <circle cx="28.8" cy="29.4" r="2.3" fill="#fff"/>
  <circle cx="35.2" cy="29.4" r="2.3" fill="#fff"/>
  <circle cx="29.2" cy="29.6" r="1.1" fill="#1c1917"/>
  <circle cx="34.8" cy="29.6" r="1.1" fill="#1c1917"/>`,

  acorn: `
  <rect x="30.3" y="5" width="3.4" height="9" rx="1.7" fill="#5b3a1e"/>
  <path d="M19 30 C19 47 27 57 32 60 C37 57 45 47 45 30 Z" fill="#cf8a43"/>
  <path d="M25 34 C25 44 28 50 31 54" stroke="#e7b277" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
  <path d="M14 31 C14 18 22 13 32 13 C42 13 50 18 50 31 Z" fill="#7a4a2a"/>
  <path d="M20 17 L26 31 M30 14 L34 31 M42 17 L38 31 M24 15 L18 28 M40 15 L46 28" stroke="#5b3a1e" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".7"/>`,

  pumpkin: `
  <path d="M31 14 C31 9 33 6 37 5 C37 8 36 11 34 14 Z" fill="#4d7c0f"/>
  <path d="M33 16 C40 12 47 8 50 12 C46 13 42 16 38 20" stroke="#65a30d" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="18" cy="38" rx="14" ry="19" fill="#ea6a0a"/>
  <ellipse cx="46" cy="38" rx="14" ry="19" fill="#ea6a0a"/>
  <ellipse cx="25" cy="38" rx="13" ry="20" fill="#f97316"/>
  <ellipse cx="39" cy="38" rx="13" ry="20" fill="#f97316"/>
  <ellipse cx="32" cy="38" rx="11" ry="21" fill="#fb8a2e"/>
  <path d="M32 17 V59 M22 20 Q17 38 22 57 M42 20 Q47 38 42 57" stroke="#d65a05" stroke-width="1.1" fill="none" opacity=".6"/>
  <path d="M20 33 l6 -7 l5 8 z M33 34 l5 -8 l6 7 z" fill="#2b1608"/>
  <path d="M21 45 Q32 56 43 45 L40 45 L37.5 49 L34.5 45 L32 49.5 L29.5 45 L26.5 49 L24 45 Z" fill="#2b1608"/>`,

  ghost: `
  <path d="M14 57 V28 C14 15 22 7 32 7 C42 7 50 15 50 28 V57 L44 51 L38 57 L32 51 L26 57 L20 51 Z" fill="#ffffff" stroke="#b9c2d0" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="25" cy="28" rx="3.2" ry="4.2" fill="#1c1917"/>
  <ellipse cx="39" cy="28" rx="3.2" ry="4.2" fill="#1c1917"/>
  <ellipse cx="32" cy="38" rx="3.2" ry="4.4" fill="#1c1917"/>`,

  firework: `
  <g stroke-linecap="round" fill="none" stroke-width="3.4">
    <g stroke="#e0a800">
      <path d="M32 21V8"/><path d="M32 43V56"/><path d="M21 32H8"/><path d="M43 32H56"/>
    </g>
    <g stroke="#4361ee">
      <path d="M24.2 24.2L15 15"/><path d="M39.8 39.8L49 49"/><path d="M24.2 39.8L15 49"/><path d="M39.8 24.2L49 15"/>
    </g>
  </g>
  <g fill="#ffd23f"><circle cx="32" cy="3.5" r="2.7"/><circle cx="32" cy="60.5" r="2.7"/><circle cx="3.5" cy="32" r="2.7"/><circle cx="60.5" cy="32" r="2.7"/></g>
  <g fill="#6c83ff"><circle cx="10.5" cy="10.5" r="2.7"/><circle cx="53.5" cy="53.5" r="2.7"/><circle cx="10.5" cy="53.5" r="2.7"/><circle cx="53.5" cy="10.5" r="2.7"/></g>
  <circle cx="32" cy="32" r="5.2" fill="#ffd23f"/>
  <circle cx="30.4" cy="30.4" r="1.6" fill="#fff4b8"/>`,

  star: `
  <circle cx="32" cy="32" r="29" fill="#1d3a8a"/>
  <circle cx="32" cy="32" r="29" fill="none" stroke="#c8202f" stroke-width="5"/>
  <circle cx="32" cy="32" r="26.5" fill="none" stroke="#ffffff" stroke-width="1.6"/>
  <path d="M32 12 l5.6 11.6 12.6 1.7 -9.2 8.8 2.3 12.6 L32 40.7 20.7 46.7 23 34.1 13.8 25.3 26.4 23.6z" fill="#ffffff"/>`,
};

// Two drawings per holiday for the faint background pattern.
export const TILE_PAIRS = {
  christmas: ["tree", "hat"],
  thanksgiving: ["turkey", "acorn"],
  halloween: ["pumpkin", "ghost"],
  newyear: ["firework", "firework"],
  fourth: ["star", "star"],
};

// The drawing that sits next to the logo.
export const ORNAMENT = {
  christmas: "tree",
  thanksgiving: "turkey",
  halloween: "pumpkin",
  newyear: "firework",
  fourth: "star",
};

export function buildTile(id, opacity = 0.13) {
  const [a, b] = TILE_PAIRS[id];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">` +
    `<g opacity="${opacity}">` +
    `<g transform="translate(14 14) scale(.6) rotate(-8 32 32)">${ART[a]}</g>` +
    `<g transform="translate(96 88) scale(.6) rotate(8 32 32)">${ART[b]}</g>` +
    `</g></svg>`
  );
}
