import { useColorTheme } from "@/lib/ThemeContext";
import { ART, ORNAMENT } from "@/lib/holidayArt";

// A small illustration next to the BuilderTrac logo while a holiday look is
// active (tree, turkey, pumpkin, firework, star). Renders nothing otherwise.
// The markup comes from our own static drawings in holidayArt.js.
export default function HolidayOrnament() {
  const { theme } = useColorTheme();
  const key = theme?.holiday ? ORNAMENT[theme.id] : null;
  if (!key) return null;
  return (
    <svg
      viewBox="0 0 64 64"
      width="28"
      height="28"
      aria-hidden="true"
      className="ml-1.5 inline-block shrink-0"
      dangerouslySetInnerHTML={{ __html: ART[key] }}
    />
  );
}
