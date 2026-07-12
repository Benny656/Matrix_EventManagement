import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  LayoutGrid,
  ChevronRight,
  BrainCircuit,
  Terminal,
  Users,
} from "lucide-react";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const role = session.user.role;
    if (role === "ADMIN") {
      redirect("/admin");
    } else if (role === "VOLUNTEER") {
      redirect("/volunteer");
    } else {
      redirect("/student");
    }
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">

      {/* Header */}
      <header className="w-full top-0 sticky bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="flex justify-between items-center px-6 py-3 w-full max-w-7xl mx-auto min-h-[60px]">
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold tracking-tighter text-foreground">MATRIX</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground -mt-0.5">AIML · Karunya University</span>
          </div>
          <Link
            href="/login"
            className="p-2 hover:bg-surface-container rounded-md transition-colors text-muted-foreground hover:text-foreground flex items-center"
            aria-label="Sign in"
          >
            <LayoutGrid size={18} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col flex-1">

        {/* Hero Section */}
        <section className="px-6 pt-20 pb-16 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-start gap-8 max-w-2xl" id="matrix-hero">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-3 py-1">
              Department of Artificial Intelligence &amp; Machine Learning
            </div>

            <h1 className="font-heading text-4xl md:text-[56px] md:leading-[1.08] text-foreground tracking-tight font-semibold" id="matrix-hero-headline">
              The event platform for<br />
              <span className="text-primary">AIML at Karunya.</span>
            </h1>

            <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-md border-l-2 border-border pl-4">
              Register for workshops, track attendance, and stay current with department updates — all in one place.
            </p>

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Link
                href="/login"
                id="hero-cta"
                className="inline-flex w-full bg-primary text-primary-foreground font-mono text-sm py-3 px-6 items-center justify-between cursor-pointer hover:bg-primary-container transition-colors active:scale-[0.98]"
              >
                <span>Access Event Portal</span>
                <ChevronRight size={16} />
              </Link>
              <p className="font-mono text-[10px] text-muted-foreground px-1">
                Sign in with your Karunya college email
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Features Grid */}
        <section className="px-6 py-16 max-w-7xl mx-auto w-full" id="matrix-features">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-6">
            What&apos;s on Matrix
          </div>

          {/* Asymmetric grid: 1 wide + 2 stacked */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-border">
            {/* Wide left card */}
            <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-border p-8 flex flex-col gap-6 group hover:bg-surface-container transition-colors">
              <div className="w-10 h-10 border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="font-mono text-sm text-foreground uppercase font-semibold tracking-wider mb-2">Workshops</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Hands-on sessions on transformer architectures, model fine-tuning, and deployment workflows — run by faculty and senior students.
                </p>
              </div>
            </div>

            {/* Right column — 2 stacked */}
            <div className="md:col-span-3 flex flex-col">
              <div className="border-b border-border p-8 flex flex-col gap-5 group hover:bg-surface-container transition-colors flex-1">
                <div className="w-10 h-10 border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="font-mono text-sm text-foreground uppercase font-semibold tracking-wider mb-2">Hackathons</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Time-boxed build sprints to solve department-specific challenges and ship real tools.
                  </p>
                </div>
              </div>

              <div className="p-8 flex flex-col gap-5 group hover:bg-surface-container transition-colors flex-1">
                <div className="w-10 h-10 border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-mono text-sm text-foreground uppercase font-semibold tracking-wider mb-2">Department Events</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Seminars, paper presentations, and collaborative sessions for Karunya&apos;s AI &amp; ML cohort.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-border bg-surface-container-lowest/60">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-5 gap-3 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Matrix · AIML</span>
            <span className="font-mono text-[10px] text-muted-foreground">© {new Date().getFullYear()} Karunya Institute of Technology and Sciences</span>
          </div>
          <div className="flex gap-5">
            <a className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
