// A file link may only be a real web address. Anything else (javascript:, data:, blob:,
// vbscript: …) returns null, so a crafted Document record cannot run script in the app.
export function safeFileUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(String(url), window.location.origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}