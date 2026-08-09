import { usePartnerLogo } from "@/lib/partnerLogo";

export default function PartnerLogo() {
  const logo = usePartnerLogo();
  if (!logo) return null;
  return (
    <span className="flex items-center gap-2">
      <span className="w-px h-6 bg-border" />
      <img src={logo} alt="Partner logo" className="h-7 max-w-[88px] object-contain" />
    </span>
  );
}