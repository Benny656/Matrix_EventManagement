"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import ShootingStarsGrid from "@/components/shooting-stars-grid";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-b from-background via-surface-container-low to-background text-foreground font-sans min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background aesthetics matching main layout */}
      <ShootingStarsGrid
        className="absolute inset-0 z-0 opacity-100 mix-blend-normal dark:mix-blend-screen"
        maskOuterStop={200}
        gridLineOpacity={0.4}
        maxActiveStars={20}
        spawnRateMin={150}
        spawnRateMax={500}
        trailLength={200}
        thickness={2}
      />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full clerk-glow-1 blur-[100px] pointer-events-none z-0 opacity-40 dark:opacity-20" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full clerk-glow-2 blur-[100px] pointer-events-none z-0 opacity-40 dark:opacity-20" />

      {/* Header controls (Top-Left Sorry and Top-Right ThemeToggle) */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border hover:bg-surface-container-high transition-all active:scale-95 duration-100 rounded-sm cursor-pointer shadow-xs"
        >
          <ArrowLeft size={13} />
          <span>Sorry</span>
        </button>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main Center Message Box with clean minimalist border */}
      <div className="relative z-10 text-center flex flex-col items-center gap-6 max-w-md p-8 glass-panel border border-border/80 rounded-xl shadow-xl">
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-full shrink-0">
          <ShieldAlert size={28} />
        </div>

        <div className="space-y-3">
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground uppercase">
            No, you are in the wrong space.
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#747686] leading-relaxed">
            RESTRICTED AREA • ACCESS DENIED
          </p>
        </div>
      </div>
    </div>
  );
}
