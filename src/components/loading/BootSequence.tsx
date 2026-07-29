"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

const BOOT_STEPS = [
  "Session Verified",
  "Authentication Complete",
  "Loading Module...",
  "Ready"
];

export default function BootSequence() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < BOOT_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 300); // 300ms stagger
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col items-start gap-2 text-[11px] font-mono tracking-widest uppercase">
      {BOOT_STEPS.map((step, index) => {
        const isVisible = index <= currentStep;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <AnimatePresence key={step}>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isActive ? 1 : 0.5, x: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[#14B8A6]"
                    >
                      <Check size={12} strokeWidth={3} />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-muted-foreground"
                    >
                      <Loader2 size={12} />
                    </motion.div>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span className={isActive ? "text-foreground animate-pulse" : "text-muted-foreground"}>
                  {step}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })}
    </div>
  );
}
