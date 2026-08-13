import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, HardHat } from "lucide-react";

const CONTACT_EMAIL = "hello@buildertrac.com";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`BuilderTrac contact from ${name || "a visitor"}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nReply to: ${email}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
            Builder<span style={{ color: "#F5A623" }}>T</span>rac
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            Log in
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold font-display">Contact Us</h1>
        </div>

        <p className="text-base text-muted-foreground mb-6">
          Questions, feedback, or need a hand getting set up? Send us a note and we'll get
          back to you.
        </p>

        <div className="space-y-6">
          {/* Email contact method */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
          >
            <Mail className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{CONTACT_EMAIL}</p>
            </div>
          </a>

          {/* Contact form */}
          <form onSubmit={handleSend} className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <div>
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label htmlFor="email2" className="text-sm font-medium">Email</label>
              <input
                id="email2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="How can we help?"
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Send message
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <HardHat className="w-4 h-4" />
          <Link to="/about" className="hover:text-primary">About BuilderTrac</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-primary">Log in</Link>
        </div>
      </main>
    </div>
  );
}