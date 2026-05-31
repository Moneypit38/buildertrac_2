import { Layers, Building2, Home, Briefcase, MapPin, Star, Hammer, TreePine } from "lucide-react";

export const PORTFOLIO_ICONS = [
  { name: "Layers", Icon: Layers },
  { name: "Building2", Icon: Building2 },
  { name: "Home", Icon: Home },
  { name: "Briefcase", Icon: Briefcase },
  { name: "MapPin", Icon: MapPin },
  { name: "Star", Icon: Star },
  { name: "Hammer", Icon: Hammer },
  { name: "TreePine", Icon: TreePine },
];

export const PORTFOLIO_COLORS = [
  { name: "orange", bg: "bg-orange-500/20", text: "text-orange-400", solid: "bg-orange-500" },
  { name: "blue", bg: "bg-blue-500/20", text: "text-blue-400", solid: "bg-blue-500" },
  { name: "green", bg: "bg-green-500/20", text: "text-green-400", solid: "bg-green-500" },
  { name: "purple", bg: "bg-purple-500/20", text: "text-purple-400", solid: "bg-purple-500" },
  { name: "red", bg: "bg-red-500/20", text: "text-red-400", solid: "bg-red-500" },
  { name: "yellow", bg: "bg-yellow-500/20", text: "text-yellow-400", solid: "bg-yellow-500" },
  { name: "teal", bg: "bg-teal-500/20", text: "text-teal-400", solid: "bg-teal-500" },
  { name: "pink", bg: "bg-pink-500/20", text: "text-pink-400", solid: "bg-pink-500" },
];

export function getColor(colorName) {
  return PORTFOLIO_COLORS.find(c => c.name === colorName) || PORTFOLIO_COLORS[0];
}

export function getIconComponent(iconName) {
  return PORTFOLIO_ICONS.find(i => i.name === iconName)?.Icon || Layers;
}

export default function PortfolioIcon({ icon = "Layers", color = "orange", size = "md" }) {
  const colorDef = getColor(color);
  const IconComp = getIconComponent(icon);
  const sizeClass = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <div className={`${sizeClass} rounded-xl ${colorDef.bg} flex items-center justify-center shrink-0`}>
      <IconComp className={`${iconSize} ${colorDef.text}`} />
    </div>
  );
}