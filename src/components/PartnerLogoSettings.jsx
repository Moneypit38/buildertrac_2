import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { usePartnerLogo, setPartnerLogo } from "@/lib/partnerLogo";
import { toast } from "sonner";

export default function PartnerLogoSettings() {
  const logo = usePartnerLogo();
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 600000) { toast.error("Logo too large — please use one under 500KB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setPartnerLogo(reader.result); toast.success("Partner logo saved"); };
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partner Logo</p>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl border border-border flex items-center justify-center overflow-hidden bg-muted/30 flex-shrink-0">
          {logo ? <img src={logo} alt="Partner logo" className="w-full h-full object-contain p-1" /> : <ImagePlus className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium min-h-[40px] active:scale-95 transition-transform">
            <ImagePlus className="w-3.5 h-3.5" /> {logo ? "Replace" : "Upload"}
          </button>
          {logo && (
            <button onClick={() => { setPartnerLogo(""); toast.success("Partner logo removed"); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-destructive min-h-[40px] active:scale-95 transition-transform">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}