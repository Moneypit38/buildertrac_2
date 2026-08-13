import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">BuilderTrac</span>
        <Link to="/about" className="hover:text-primary">About</Link>
        <Link to="/contact" className="hover:text-primary">Contact</Link>
        <Link to="/privacy-policy" className="hover:text-primary">Privacy</Link>
        <Link to="/support" className="hover:text-primary">Support</Link>
      </div>
    </footer>
  );
}