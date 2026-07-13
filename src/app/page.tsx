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
  Mail,
} from "lucide-react";
import LandingAnimations from "@/components/landing-animations";
import MockTerminal from "@/components/mock-terminal";
import ThemeToggle from "@/components/theme-toggle";
import ShootingStarsGrid from "@/components/shooting-stars-grid";
import { MATRIX_SOCIALS } from "@/lib/constants";
import { LinkedInIcon, InstagramIcon, GitHubIcon } from "@/components/ui/brand-icons";

const socialLinks = [
  {
    name: "LinkedIn",
    href: MATRIX_SOCIALS.linkedin,
    icon: LinkedInIcon,
    description: "Professional updates, event milestones & industry connects.",
    bgColor: "hover:bg-primary/5 hover:border-primary/30",
    iconColor: "text-primary",
    tag: "@matrix-karunya",
  },
  {
    name: "Instagram",
    href: MATRIX_SOCIALS.instagram,
    icon: InstagramIcon,
    description: "Glimpses of hackathons, workshop highlights & student life.",
    bgColor: "hover:bg-primary/5 hover:border-primary/30",
    iconColor: "text-primary",
    tag: "@matrixkarunya",
  },
  {
    name: "GitHub",
    href: MATRIX_SOCIALS.github,
    icon: GitHubIcon,
    description: "Explore repositories, student projects & open-source code.",
    bgColor: "hover:bg-primary/5 hover:border-primary/30",
    iconColor: "text-primary",
    tag: "matrix-aiml-karunya",
  },
  {
    name: "Email Contact",
    href: MATRIX_SOCIALS.email,
    icon: Mail,
    description: "Queries, collaborations, guest talks & partnerships.",
    bgColor: "hover:bg-primary/5 hover:border-primary/30",
    iconColor: "text-primary",
    tag: "matrix@karunya.edu.in",
  },
];

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
    <div className="bg-gradient-to-b from-background via-surface-container-low to-background text-foreground font-sans min-h-screen flex flex-col relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Glowing background shapes and animated shooting stars grid */}
      <ShootingStarsGrid 
        className="absolute inset-0 z-0 opacity-100 mix-blend-normal dark:mix-blend-screen" 
        maskOuterStop={200}
        gridLineOpacity={0.6}
        maxActiveStars={35}
        spawnRateMin={100}
        spawnRateMax={400}
        trailLength={250}
        thickness={2}
      />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full clerk-glow-1 blur-[120px] pointer-events-none z-0 animate-pulse-slow opacity-50 dark:opacity-30" />
      <div className="absolute top-[25%] left-[-10%] w-[500px] h-[500px] rounded-full clerk-glow-2 blur-[100px] pointer-events-none z-0 opacity-50 dark:opacity-30" />
      <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full clerk-glow-1 blur-[150px] pointer-events-none z-0 opacity-15 dark:opacity-10" />

      <LandingAnimations />

      {/* Header */}
      <header className="w-full top-0 sticky bg-background/60 backdrop-blur-md border-b border-border z-50 transition-all">
        <div className="flex justify-between items-center px-6 py-3 w-full max-w-7xl mx-auto min-h-[64px]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Matrix Logo" className="h-8 w-8 object-contain opacity-95 hover:opacity-100 transition-all filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:invert" />
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground uppercase">MATRIX</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground -mt-0.5">AIML · Karunya University</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="flex items-center justify-center p-2.5 bg-card hover:bg-muted/50 border border-border rounded-md shadow-sm transition-all text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Sign in"
            >
              <LayoutGrid size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col flex-1 relative z-10">

        {/* Hero Section */}
        <section className="px-6 pt-16 md:pt-24 pb-20 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column (Hero copy) */}
            <div className="flex flex-col items-start gap-6 lg:col-span-7" id="matrix-hero">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 font-mono text-[9px] uppercase tracking-widest text-primary bg-primary/5 border border-primary/20 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Department of Artificial Intelligence &amp; Machine Learning
              </div>

              <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground animate-fade-in" id="matrix-hero-headline">
                The event platform for<br />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  AIML at Karunya.
                </span>
              </h1>

              <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-md border-l-2 border-primary/30 pl-4">
                Register for workshops, track attendance, and stay current with department updates — built for the next generation of builders.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full max-w-md mt-2">
                <Link
                  href="/login"
                  id="hero-cta"
                  className="inline-flex bg-primary text-primary-foreground font-mono text-sm py-3.5 px-7 items-center justify-between cursor-pointer hover:bg-primary/95 transition-all shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 rounded-full font-bold group active:scale-[0.98] flex-1 sm:flex-none border border-black/5"
                >
                  <span>Access Event Portal</span>
                  <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform ml-2 text-primary-foreground/90" />
                </Link>
                <div className="flex flex-col justify-center px-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Sign in with college email
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (Animated Mock Terminal) */}
            <div className="w-full lg:col-span-5 flex justify-center">
              <MockTerminal />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Features Grid */}
        <section className="px-6 py-20 max-w-7xl mx-auto w-full" id="matrix-features">
          <div className="font-mono text-[10px] text-primary uppercase tracking-widest mb-8 flex items-center gap-2 font-bold">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            What&apos;s on Matrix
          </div>

          {/* Asymmetric grid: 1 wide + 2 stacked */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Wide left card */}
            <div className="feature-card md:col-span-2 border border-border/80 bg-card hover:bg-card/90 p-8 flex flex-col justify-between gap-6 group hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent blur-xl pointer-events-none" />
              <div className="w-11 h-11 rounded-lg border border-border/80 bg-muted/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="font-mono text-sm text-foreground uppercase font-semibold tracking-wider mb-2 group-hover:text-primary transition-colors">Workshops</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Hands-on sessions on transformer architectures, model fine-tuning, and deployment workflows — run by faculty and senior students.
                </p>
              </div>
            </div>

            {/* Right column — 2 stacked */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="feature-card border border-border/80 bg-card hover:bg-card/90 p-8 flex flex-col justify-between gap-6 group hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 rounded-xl relative overflow-hidden flex-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent blur-xl pointer-events-none" />
                <div className="w-11 h-11 rounded-lg border border-border/80 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="font-mono text-sm text-foreground uppercase font-semibold tracking-wider mb-2 group-hover:text-primary transition-colors">Hackathons</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Time-boxed build sprints to solve department-specific challenges and ship real tools.
                  </p>
                </div>
              </div>

              <div className="feature-card border border-border/80 bg-card hover:bg-card/90 p-8 flex flex-col justify-between gap-6 group hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 rounded-xl relative overflow-hidden flex-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent blur-xl pointer-events-none" />
                <div className="w-11 h-11 rounded-lg border border-border/80 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-mono text-sm text-foreground uppercase font-semibold tracking-wider mb-2 group-hover:text-primary transition-colors">Department Events</h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Seminars, paper presentations, and collaborative sessions for Karunya&apos;s AI &amp; ML cohort.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Let's Connect Section */}
        <section className="px-6 py-20 max-w-7xl mx-auto w-full border-t border-border/60" id="matrix-socials">
          <div className="font-mono text-[10px] text-primary uppercase tracking-widest mb-8 flex items-center gap-2 font-bold">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Let&apos;s Connect
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.name !== "Email Contact" ? "_blank" : undefined}
                  rel={social.name !== "Email Contact" ? "noopener noreferrer" : undefined}
                  className={`group relative flex flex-col justify-between p-6 bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-2.5 hover:scale-[1.02] hover:shadow-lg ${social.bgColor}`}
                >
                  {/* Subtle ambient light gradient that glows on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-muted/40 border border-border/60 group-hover:bg-background group-hover:border-primary/20 transition-all duration-300 ${social.iconColor}`}>
                      <Icon size={22} className="transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors font-bold">
                      {social.name}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                      {social.description}
                    </p>
                    <div className="font-mono text-[10px] text-foreground/80 font-semibold tracking-wide truncate group-hover:text-primary transition-colors">
                      {social.tag}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-border/60 bg-background/40 backdrop-blur relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-5 gap-3 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Matrix · AIML</span>
            <span className="font-mono text-[9px] text-muted-foreground">© {new Date().getFullYear()} Karunya Institute of Technology and Sciences</span>
          </div>
          <div className="flex gap-5">
            <a className="font-mono text-[9px] text-muted-foreground hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="font-mono text-[9px] text-muted-foreground hover:text-primary transition-colors" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
