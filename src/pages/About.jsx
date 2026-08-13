import React from "react";
import { Link } from "react-router-dom";
import { HardHat } from "lucide-react";

export default function About() {
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
            <HardHat className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold font-display">About BuilderTrac</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            BuilderTrac is a streamlined project management app built for independent
            contractors, small construction firms, and field crews who need to keep every
            job site organized without the overhead of enterprise software. It brings the
            day-to-day work of running a build &mdash; tracking tasks, scheduling
            appointments, capturing site photos, storing documents, and managing project
            budgets &mdash; into one lean, fast workspace that fits in a pocket.
          </p>
          <p>
            The platform is designed for general contractors, trades, and service teams
            who want a clear view of every active project at a glance. Portfolios group
            related builds together; each project carries its own tasks, notes, team
            members, documents, photos, and appointments; and a simple dashboard surfaces
            what needs attention today, this week, and later. Because it is built mobile
            first, crews can capture progress in the field and sync it the moment they have
            a signal.
          </p>
          <p>
            BuilderTrac is built and maintained by a small team that understands
            construction workflows firsthand &mdash; not a tech company guessing at what
            trades need. The goal is simple: give smaller firms the same clarity and
            control the big players pay for, at a price that respects how an independent
            business actually runs. We keep the interface clean, the features focused, and
            the experience fast, so you spend less time managing software and more time
            building.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Contact us
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}