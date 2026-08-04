"use client";

// TEMPORARY MAINTENANCE PAGE - Restore original landing page after maintenance by uncommenting the code below.

import { useEffect, useMemo, useState } from "react";

type TimeLeft = {
  hours: number;
  minutes: number;
  seconds: number;
};

function getTargetTime(): Date {
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12,
    30,
    0
  );
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

function useCountdown(target: Date): TimeLeft {
  // Compute an initial value synchronously instead of starting at 0,0,0
  // (avoids a visible flash of "00:00:00" before the first effect runs).
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(target));

  useEffect(() => {
    // Re-sync immediately when the target changes, then tick every second.
    setTimeLeft(calcTimeLeft(target));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
    // target is a Date object; use its numeric value as the effect's
    // dependency so the interval isn't torn down/recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.getTime()]);

  return timeLeft;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-white/15 text-4xl font-bold text-white sm:size-24 sm:text-5xl">
        {String(value).padStart(2, "0")}
      </div>
      <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/80">
        {label}
      </span>
    </div>
  );
}

export default function MaintenancePage() {
  // Only compute the target time once per mount, not on every render,
  // so the countdown effect doesn't get reset each time the component re-renders.
  const target = useMemo(() => getTargetTime(), []);
  const { hours, minutes, seconds } = useCountdown(target);

  const backOnlineLabel = useMemo(
    () =>
      target.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    [target]
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF9] px-6 py-12 text-center">
      <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl md:text-6xl">
        We&apos;re currently under an update
      </h1>

      <p className="mt-6 max-w-xl text-lg text-[#8B8FA3]">
        The platform is temporarily down while we roll out an update. We
        request everyone to kindly wait until we&apos;re back online.
      </p>

      <div className="mt-10 w-full max-w-2xl rounded-3xl bg-[#4B5A47] px-6 py-10 text-white sm:px-12">
        <p className="text-sm font-bold uppercase tracking-widest text-white/80">
          Back online at
        </p>
        <p className="mt-2 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          {backOnlineLabel}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-5">
          <CountdownBox value={hours} label="Hours" />
          <span className="mb-6 text-3xl font-bold text-white/50">:</span>
          <CountdownBox value={minutes} label="Minutes" />
          <span className="mb-6 text-3xl font-bold text-white/50">:</span>
          <CountdownBox value={seconds} label="Seconds" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ORIGINAL LANDING PAGE IMPLEMENTATION (PRESERVED BELOW FOR EASY RESTORATION)
// ============================================================================

// import { redirect } from "next/navigation";
// import Link from "next/link";
// import { getCurrentUser } from "@/lib/auth-session";
// import {
//   LayoutGrid,
//   ChevronRight,
//   BrainCircuit,
//   Terminal,
//   Users,
//   Mail,
// } from "lucide-react";
// import LandingAnimations from "@/components/landing-animations";
// import MockTerminal from "@/components/mock-terminal";
// import ThemeToggle from "@/components/theme-toggle";
// import ShootingStarsGrid from "@/components/shooting-stars-grid";
// import { MATRIX_SOCIALS } from "@/lib/constants";
// import { LinkedInIcon, InstagramIcon, GitHubIcon } from "@/components/ui/brand-icons";
// import LandingFadeContainer from "@/components/landing-fade-container";
// import WhatsOnMatrixSection from "@/components/whats-on-matrix-section";
// 
// export const dynamic = "force-dynamic";
// 
// const socialLinks = [
//   {
//     name: "LinkedIn",
//     href: MATRIX_SOCIALS.linkedin,
//     icon: LinkedInIcon,
//     description: "Professional updates, event milestones & industry connects.",
//     bgColor: "hover:bg-primary/5 hover:border-primary/30",
//     iconColor: "text-primary",
//     tag: "@matrix-karunya",
//   },
//   {
//     name: "Instagram",
//     href: MATRIX_SOCIALS.instagram,
//     icon: InstagramIcon,
//     description: "Glimpses of hackathons, workshop highlights & student life.",
//     bgColor: "hover:bg-primary/5 hover:border-primary/30",
//     iconColor: "text-primary",
//     tag: "@matrixkarunya",
//   },
//   {
//     name: "GitHub",
//     href: MATRIX_SOCIALS.github,
//     icon: GitHubIcon,
//     description: "Explore repositories, student projects & open-source code.",
//     bgColor: "hover:bg-primary/5 hover:border-primary/30",
//     iconColor: "text-primary",
//     tag: "matrix-aiml-karunya",
//   },
//   {
//     name: "Email Contact",
//     href: MATRIX_SOCIALS.email,
//     icon: Mail,
//     description: "Queries, collaborations, guest talks & partnerships.",
//     bgColor: "hover:bg-primary/5 hover:border-primary/30",
//     iconColor: "text-primary",
//     tag: "matrixkarunya@gmail.com",
//   },
// ];
// 
// export default async function Home() {
//   const user = await getCurrentUser();
// 
//   const dashboardHref = user
//     ? user.role === "ADMIN" || user.role === "FACULTY_ADMIN"
//       ? "/admin"
//       : user.role === "VOLUNTEER"
//       ? "/volunteer"
//       : user.role === "FACULTY"
//       ? "/faculty"
//       : "/student"
//     : "/login";
// 
//   const buttonText = user ? "Dashboard" : "Sign In";
//   const ctaText = user ? "Go to Dashboard" : "Access Event Portal";
// 
//   return (
//     <LandingFadeContainer>
//       <div className="bg-gradient-to-b from-background via-surface-container-low to-background text-foreground font-sans min-h-screen flex flex-col relative overflow-hidden selection:bg-primary/10 selection:text-primary">
//         {/* Glowing background shapes and animated shooting stars grid */}
//         <ShootingStarsGrid 
//           className="absolute inset-0 z-0 opacity-100 mix-blend-normal dark:mix-blend-screen" 
//           maskOuterStop={200}
//           gridLineOpacity={0.6}
//           maxActiveStars={35}
//           spawnRateMin={100}
//           spawnRateMax={400}
//           trailLength={250}
//           thickness={2}
//         />
//         <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full clerk-glow-1 blur-[120px] pointer-events-none z-0 animate-pulse-slow opacity-50 dark:opacity-30" />
//         <div className="absolute top-[25%] left-[-10%] w-[500px] h-[500px] rounded-full clerk-glow-2 blur-[100px] pointer-events-none z-0 opacity-50 dark:opacity-30" />
//         <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full clerk-glow-1 blur-[150px] pointer-events-none z-0 opacity-15 dark:opacity-10" />
// 
//         <LandingAnimations />
// 
//         {/* Header */}
//         <header className="w-full top-0 sticky bg-background/60 backdrop-blur-md border-b border-border z-50 transition-all">
//           <div className="flex justify-between items-center px-6 py-3 w-full max-w-7xl mx-auto min-h-[64px]">
//             <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
//               <img src="/logo.png" alt="Matrix Logo" className="h-8 w-8 object-contain opacity-95 hover:opacity-100 transition-all filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:invert" />
//               <div className="flex flex-col">
//                 <span className="font-heading text-lg font-bold tracking-tight text-foreground uppercase">MATRIX</span>
//                 <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground -mt-0.5">AIML · Karunya University</span>
//               </div>
//             </Link>
// 
//             <div className="flex items-center gap-3">
//               <ThemeToggle />
//               <Link href={dashboardHref}>
//                 <button className="px-4 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:bg-primary/90 transition-all rounded-md font-semibold">
//                   {buttonText}
//                 </button>
//               </Link>
//             </div>
//           </div>
//         </header>
// 
//         {/* Main Content */}
//         <main className="flex flex-col flex-1 relative z-10">
//           {/* Hero Section */}
//           <section className="px-6 pt-16 md:pt-24 pb-20 max-w-7xl mx-auto w-full">
//             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
//               {/* Left Column (Hero copy) */}
//               <div className="flex flex-col items-start gap-6 lg:col-span-7" id="matrix-hero">
//                 <div className="inline-flex items-center gap-2 px-3.5 py-1 font-mono text-[9px] uppercase tracking-widest text-primary bg-primary/5 border border-primary/20 rounded-full shadow-sm">
//                   <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
//                   Department of Artificial Intelligence &amp; Machine Learning
//                 </div>
// 
//                 <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground animate-fade-in" id="matrix-hero-headline">
//                   The event platform for<br />
//                   <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
//                     AIML at Karunya.
//                   </span>
//                 </h1>
// 
//                 <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-md border-l-2 border-primary/30 pl-4">
//                   Register for workshops, track attendance, and stay current with department updates — built for the next generation of builders.
//                 </p>
// 
//                 <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full max-w-md mt-2">
//                   <Link
//                     href={dashboardHref}
//                     id="hero-cta"
//                     className="inline-flex bg-primary text-primary-foreground font-mono text-sm py-3.5 px-7 items-center justify-between cursor-pointer hover:bg-primary/95 transition-all shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 rounded-full font-bold group active:scale-[0.98] flex-1 sm:flex-none border border-black/5"
//                   >
//                     <span>{ctaText}</span>
//                     <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform ml-2 text-primary-foreground/90" />
//                   </Link>
//                   <div className="flex flex-col justify-center px-2">
//                     <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
//                       Sign in with college email
//                     </span>
//                   </div>
//                 </div>
//               </div>
// 
//               {/* Right Column (Animated Mock Terminal) */}
//               <div className="w-full lg:col-span-5 flex justify-center">
//                 <MockTerminal />
//               </div>
//             </div>
//           </section>
// 
//           {/* Divider */}
//           <div className="border-t border-border/60" />
// 
//           {/* Animated Features Grid */}
//           <WhatsOnMatrixSection />
// 
//           {/* Social Links Section */}
//           <section className="w-full mt-10 pb-20 px-6 max-w-7xl mx-auto">
//             <div className="text-center mb-8">
//               <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-foreground">
//                 Connect With Matrix AIML
//               </h2>
//               <p className="font-mono text-xs text-muted-foreground mt-1 uppercase tracking-widest">
//                 Official Channels &amp; Handles
//               </p>
//             </div>
// 
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//               {socialLinks.map((social) => {
//                 const Icon = social.icon;
//                 return (
//                   <a
//                     key={social.name}
//                     href={social.href}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className={`border border-border bg-card p-4 rounded-md flex flex-col justify-between transition-all group ${social.bgColor}`}
//                   >
//                     <div>
//                       <div className="flex items-center justify-between mb-3">
//                         <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
//                           {social.name}
//                         </span>
//                         <Icon size={18} className={`${social.iconColor} transition-transform group-hover:scale-110`} />
//                       </div>
//                       <p className="font-sans text-xs text-muted-foreground text-left line-clamp-2 leading-relaxed">
//                         {social.description}
//                       </p>
//                     </div>
//                     <span className="font-mono text-[10px] text-muted-foreground mt-4 block text-left group-hover:text-primary transition-colors">
//                       {social.tag}
//                     </span>
//                   </a>
//                 );
//               })}
//             </div>
//           </section>
//         </main>
// 
//         {/* Footer */}
//         <footer className="w-full border-t border-border bg-card/50 py-6 px-6 z-10">
//           <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
//             <div className="flex items-center gap-4">
//               <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Matrix · AIML</span>
//               <span className="font-mono text-[9px] text-muted-foreground">© {new Date().getFullYear()} Karunya Institute of Technology and Sciences</span>
//             </div>
//             <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
//               <span>Developed by</span>
//               <a
//                 href="https://benny656.github.io/"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="font-semibold text-foreground hover:text-primary transition-colors hover:underline underline-offset-2"
//               >
//                 Benny Manuel
//               </a>
//               <a
//                 href="https://www.linkedin.com/in/benman656"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-primary hover:text-primary/80 transition-colors inline-flex items-center ml-0.5"
//                 aria-label="Benny Manuel LinkedIn Profile"
//               >
//                 <LinkedInIcon size={13} className="shrink-0" />
//               </a>
//             </div>
//           </div>
//         </footer>
//       </div>
//     </LandingFadeContainer>
//   );
// }
