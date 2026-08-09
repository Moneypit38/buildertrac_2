import { MapPin, Mail, Phone, ChevronRight, User } from "lucide-react";

function ContactRow({ href, icon: Icon, iconBg, label, value, external }) {
  const content = (
    <>
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[11px] font-medium text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </>
  );

  if (!href) {
    return (
      <div className="flex items-center gap-3 px-3 py-3 min-h-[56px]">
        {content}
      </div>
    );
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-3 min-h-[56px] rounded-xl hover:bg-accent active:scale-[0.98] transition-all">
        {content}
      </a>
    );
  }

  return (
    <a href={href}
      className="flex items-center gap-3 px-3 py-3 min-h-[56px] rounded-xl hover:bg-accent active:scale-[0.98] transition-all">
      {content}
  </a>
  );
}

export default function ContactInfoCard({ portfolio }) {
  const hasAnything = portfolio.contact_name || portfolio.contact_email || portfolio.contact_phone || portfolio.business_address;
  if (!hasAnything) return null;

  const rows = [];
  if (portfolio.contact_name) {
    rows.push(
      <ContactRow key="name" icon={User} iconBg="bg-primary/15 text-primary" label="Contact" value={portfolio.contact_name} />
    );
  }
  if (portfolio.business_address) {
    rows.push(
      <ContactRow key="addr"
        icon={MapPin}
        iconBg="bg-orange-500/15 text-orange-500"
        label="Address"
        value={portfolio.business_address}
        href={`https://maps.apple.com/?daddr=${encodeURIComponent(portfolio.business_address)}`}
        external
      />
    );
  }
  if (portfolio.contact_email) {
    rows.push(
      <ContactRow key="email"
        icon={Mail}
        iconBg="bg-blue-500/15 text-blue-500"
        label="Email"
        value={portfolio.contact_email}
        href={`mailto:${portfolio.contact_email}`}
      />
    );
  }
  if (portfolio.contact_phone) {
    rows.push(
      <ContactRow key="phone"
        icon={Phone}
        iconBg="bg-green-500/15 text-green-500"
        label="Phone"
        value={portfolio.contact_phone}
        href={`tel:${portfolio.contact_phone.replace(/[^0-9+]/g, "")}`}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Client Contact</p>
      <div className="bg-accent/40 border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {rows.map((r, i) => (
          <div key={i}>{r}</div>
        ))}
      </div>
    </div>
  );
}