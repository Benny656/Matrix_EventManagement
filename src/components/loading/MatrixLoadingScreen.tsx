"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { getSectionLoadingMeta } from "./LoadingMessages";

interface MatrixLoadingScreenProps {
  message?: string;
  minDurationMs?: number;
}

export default function MatrixLoadingScreen({
  message,
  minDurationMs = 1000,
}: MatrixLoadingScreenProps) {
  const pathname = usePathname() || "";
  const path = pathname.toLowerCase();
  const isLandingPage = path === "/" || path === "" || path === "/home";

  if (!isLandingPage) {
    return null;
  }

  const sectionMeta = getSectionLoadingMeta(pathname);
  const activeMessage = message || sectionMeta.message;
  const headerTag = sectionMeta.headerTag;
  const commandText = sectionMeta.command;

  // Enforce 1 second (1000ms) minimum display duration
  const [phase, setPhase] = useState<"EXEC" | "VERIFY" | "OK">("EXEC");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase("VERIFY");
    }, Math.floor(minDurationMs / 2));

    const timer2 = setTimeout(() => {
      setPhase("OK");
    }, minDurationMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [minDurationMs]);

  const containerClasses =
    "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xs text-foreground overflow-hidden select-none px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]";

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Top Indeterminate Progress Bar (Synced to 1s) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container overflow-hidden z-20">
        <motion.div
          className="h-full bg-primary"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.0,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Subtle Terminal Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "28px 28px",
          color: "var(--muted-foreground)",
        }}
      />

      {/* Center Terminal Box */}
      <motion.div
        className="relative z-10 max-w-sm sm:max-w-md w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Terminal Header Bar */}
        <div className="bg-surface-container px-4 py-2.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {headerTag}
          </span>
        </div>

        {/* Terminal Body Content */}
        <div className="p-5 font-mono text-xs space-y-3.5 bg-background/50">
          {/* Logo Mark + Title */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/40">
            <motion.div
              className="relative w-8 h-8 shrink-0 flex items-center justify-center"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <img
                src="/logo.svg"
                alt="Matrix Logo"
                className="w-full h-full object-contain dark:invert"
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                Matrix Engine
              </span>
              <span className="text-[10px] text-muted-foreground">
                v2.4.0 • AIML Karunya
              </span>
            </div>
          </div>

          {/* Terminal Command & Output Stream */}
          <div className="space-y-1.5 pt-1 text-left">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 truncate">
              <span className="text-primary font-bold">$</span>
              <span className="truncate">{commandText}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-foreground font-semibold">
              <span className="text-primary font-bold">&gt;</span>
              <span className="truncate">{activeMessage}</span>
              <motion.span
                className="w-2 h-4 bg-primary inline-block shrink-0"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Sub-status Bar */}
          <div className="pt-2.5 flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/30">
            <span className="uppercase tracking-widest font-mono">
              {phase === "OK" ? "STATUS: COMPLETED" : sectionMeta.subStatus}
            </span>
            <span className="text-primary font-mono font-bold">
              {phase}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
