import { Download, Apple, Info } from "lucide-react";

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

const SPECS = [
  { label: "Primary (required)", device: "iPhone 15 Pro Max / 6.7\"", size: "1290 × 2796 px", slots: "Up to 10" },
  { label: "Also accepted", device: "iPhone 14 Pro Max / 6.5\"", size: "1242 × 2688 px", slots: "Up to 10" },
  { label: "iPad (optional)", device: "iPad Pro 12.9\" 2nd gen+", size: "2048 × 2732 px", slots: "Up to 10" },
];

export default function AppStoreMockups() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3 pt-2">
        <Apple className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold font-display">App Store Mockups</h1>
          <p className="text-xs text-muted-foreground">5 screenshots ready for App Store Connect</p>
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
          Upload these mockups in App Store Connect → Your App → iOS App → Screenshots. The 6.7" set covers all iPhone sizes automatically.
        </p>
      </div>

      {/* Mockup Gallery */}
      <div className="space-y-4">
        {MOCKUPS.map((m) => (
          <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <img
              src={m.url}
              alt={m.title}
              className="w-full object-cover"
            />
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{m.caption}</p>
                <p className="text-xs text-muted-foreground">{m.subtitle}</p>
              </div>
              <a
                href={m.url}
                download={`buildertrac-screenshot-${m.id}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Save
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted/50 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Upload checklist for App Store Connect</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Log in at <span className="font-mono">appstoreconnect.apple.com</span></li>
          <li>Select your app → iOS App → Version Information</li>
          <li>Scroll to "iPhone 6.7-inch Display" → upload all 5 screenshots</li>
          <li>Screenshots auto-apply to smaller iPhone sizes</li>
          <li>Add iPad screenshots separately if supporting iPad</li>
        </ul>
      </div>
    </div>
  );
}