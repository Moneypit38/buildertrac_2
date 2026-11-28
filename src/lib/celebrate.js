// Fire a small celebration (confetti and a check badge). Rendered by <CelebrationHost /> in the layout.
export function celebrate(text = "Follow-up done!") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("celebrate", { detail: { text } }));
}
