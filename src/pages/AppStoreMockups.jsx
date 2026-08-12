import { useState } from "react";
import { Download, Apple, Info } from "lucide-react";
import { toast } from "sonner";

const MOCKUPS = [
  {
    id: 1,
    title: "Dashboard Overview",
    caption: "YOUR PROJECTS. ONE PLACE.",
    subtitle: "Track every job site at a glance",
    url: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/57288ef30_generated_image.png",
  },
  {
    id: 2,
    title: "Portfolio Management",
    caption: "MANAGE YOUR PORTFOLIOS.",
    subtitle: "Group and organize every client's projects",
    url: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/e20bc659a_generated_image.png",
  },
  {
    id: 3,
    title: "Documents",
    caption: "ALL YOUR DOCS. ALWAYS HANDY.",
    subtitle: "Plans, RFIs, contracts — organized by project",
    url: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/5f672aa2b_generated_image.png",
  },
  {
    id: 4,
    title: "Projects List",
    caption: "EVERY PROJECT. FULLY TRACKED.",
    subtitle: "Budgets, status, and team — all in one tap",
    url: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/d7227fb38_generated_image.png",
  },
  {
    id: 5,
    title: "Site Photos",
    caption: "CAPTURE SITE PROGRESS.",
    subtitle: "Photos organized by project, always in sync",
    url: "https://media.base44.com/images/public/6a1c6a3340e642df44a0130d/896ef11fe_generated_image.png",
  },
];

// 6.9" iPhone 16 Pro Max — the slot the user is uploading into
const TARGET_W = 1320;
const TARGET_H = 2868;

const SPECS = [
  { label: "Primary (required)", device: "iPhone 16 Pro Max / 6.9\"", size: `${TARGET_W} × ${TARGET_H} px`, slots: "Up to 10" },
  { label: "Also accepted", device: "iPhone 15 Pro Max / 6.7\"", size: "1290 × 2796 px", slots: "Up to 10" },
  { label: "Also accepted", device: "iPhone 14 Pro Max / 6.5\"", size: "1242 × 2688 px", slots: "Up to 10" },
];

export default function AppStoreMockups() {
  const [busyId, setBusyId] = useState(null);

  // Renders the source mockup onto a canvas at the exact 6.9" dimensions (cover-fit),
  // then downloads the PNG. App Store Connect requires pixel-exact sizing.
  const saveAt69 = async (m) => {
    setBusyId(m.id);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = m.url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_W;
      canvas.height = TARGET_H;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, TARGET_W, TARGET_H);

      const scale = Math.min(TARGET_W / img.width, TARGET_H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (TARGET_W - w) / 2, (TARGET_H - h) / 2, w, h);

      await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("toBlob failed"));
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `buildertrac-69-${m.id}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          resolve();
        }, "image/png");
      });
      toast.success(`Saved at ${TARGET_W}×${TARGET_H}`);
    } catch {
      toast.error("Resize blocked — opening original instead");
      window.open(m.url, "_blank");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3 pt-2">
        <Apple className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold font-display">App Store Mockups</h1>
          <p className="text-xs text-muted-foreground">5 screenshots sized for the 6.9" iPhone slot</p>
        </div>
      </div>

      {/* Specs Panel */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">App Store Connect Screenshot Specs</p>
        </div>
        <div className="space-y-2">
          {SPECS.map(s => (
            <div key={s.device} className="flex items-start justify-between gap-2 text-xs">
              <div>
                <span className="font-medium text-foreground">{s.device}</span>
                <span className="ml-2 text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">{s.size}</span>
                <span className="ml-2 text-muted-foreground">{s.slots}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Tap <span className="font-medium text-foreground">Save 6.9"</span> on each mockup to download a PNG already sized to {TARGET_W}×{TARGET_H}. Upload those files to the 6.9" slot in App Store Connect.
        </p>
      </div>

      {/* Mockup Gallery */}
      <div className="space-y-4">
        {MOCKUPS.map((m) => (
          <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="w-full bg-muted" style={{ aspectRatio: `${TARGET_W} / ${TARGET_H}` }}>
              <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
            </div>
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{m.caption}</p>
                <p className="text-xs text-muted-foreground">{m.subtitle}</p>
              </div>
              <button
                onClick={() => saveAt69(m)}
                disabled={busyId === m.id}
                className="shrink-0 flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {busyId === m.id ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {busyId === m.id ? "…" : "Save 6.9\""}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted/50 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Upload checklist for App Store Connect</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Log in at <span className="font-mono">appstoreconnect.apple.com</span></li>
          <li>Select your app → iOS App → Version Information</li>
          <li>Scroll to the <span className="font-medium text-foreground">iPhone 6.9-inch Display</span> slot → upload all 5 PNGs</li>
          <li>Each file is pre-sized to {TARGET_W}×{TARGET_H}, so it will pass the dimension check</li>
          <li>Add iPad screenshots separately if supporting iPad</li>
        </ul>
      </div>
    </div>
  );
}