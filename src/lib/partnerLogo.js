import { useEffect, useState } from "react";

const KEY = "partner-logo-url";

export function getPartnerLogo() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}

export function setPartnerLogo(url) {
  try {
    if (url) localStorage.setItem(KEY, url);
    else localStorage.removeItem(KEY);
  } catch { /* ignore quota errors */ }
  window.dispatchEvent(new Event("partner-logo-change"));
}

export function usePartnerLogo() {
  const [logo, setLogo] = useState(getPartnerLogo);
  useEffect(() => {
    const handler = () => setLogo(getPartnerLogo());
    window.addEventListener("partner-logo-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("partner-logo-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return logo;
}