import { useColorTheme } from "@/lib/ThemeContext";

// Small original illustrations that sit next to the BuilderTrac logo while a
// holiday look is active. Renders nothing the rest of the year.
const ORNAMENTS = {
  christmas: (
    <>
      <path d="M12 13C8 13 4 11 3 6c5 0 8 2 9 7z" fill="#16a34a" />
      <path d="M12 13c4 0 8-2 9-7-5 0-8 2-9 7z" fill="#0f5132" />
      <circle cx="10.5" cy="14.5" r="2.2" fill="#c8102e" />
      <circle cx="14" cy="15" r="2.2" fill="#c8102e" />
      <circle cx="12.2" cy="17.5" r="2.2" fill="#e11d48" />
    </>
  ),
  thanksgiving: (
    <>
      <path d="M12 2C19 7 19 17 12 22C5 17 5 7 12 2Z" fill="#b3590f" />
      <path d="M12 6V22" stroke="#fde68a" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  halloween: (
    <>
      <rect x="11" y="2.5" width="2.4" height="4" rx="1" fill="#65a30d" />
      <ellipse cx="12" cy="14" rx="9" ry="7.5" fill="#f97316" />
      <path d="M7.5 11.5l2.5 2-2.5 0zM16.5 11.5l-2.5 2 2.5 0zM8.5 17c1.2 1.4 5.8 1.4 7 0" fill="#1c1917" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  newyear: (
    <>
      <path d="M10 3l1.6 5.4L17 10l-5.4 1.6L10 17l-1.6-5.4L3 10l5.4-1.6z" fill="#d4af37" />
      <path d="M18 14l.9 2.6 2.6.9-2.6.9L18 21l-.9-2.6-2.6-.9 2.6-.9z" fill="#6366f1" />
    </>
  ),
  fourth: (
    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="#b22234" />
  ),
};

export default function HolidayOrnament() {
  const { theme } = useColorTheme();
  const art = theme?.holiday ? ORNAMENTS[theme.id] : null;
  if (!art) return null;
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="ml-1 inline-block shrink-0">
      {art}
    </svg>
  );
}
