"use client";

import React from "react";
import { motion } from "framer-motion";
import MatrixLogo from "./MatrixLogo";
import ModuleIcon from "./ModuleIcon";
import BootSequence from "./BootSequence";
import ProgressBar from "./ProgressBar";
import { getLoadingMessage } from "./LoadingMessages";

interface MatrixLoaderProps {
  pathname: string;
}

export default function MatrixLoader({ pathname }: MatrixLoaderProps) {
  const message = getLoadingMessage(pathname);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[600px] flex flex-col items-center justify-center overflow-hidden bg-[#F8FAFC]">
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-45"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #64748B 1px, transparent 0)",
          backgroundSize: "24px 24px",
          opacity: 0.04
        }}
      />
      
      {/* Content Container */}
      <motion.div 
        className="z-10 flex flex-col items-center gap-8 max-w-sm w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        
        {/* Header Section */}
        <div className="flex flex-col items-center gap-3">
          <MatrixLogo />
          
          <div className="flex flex-col items-center gap-1 mt-4">
            <span className="font-mono text-[10px] text-[#64748B] tracking-[0.3em] uppercase">
              Matrix OS
            </span>
          </div>
        </div>

        {/* Initialization Message & Icon */}
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full border border-border/50 shadow-sm">
          <ModuleIcon pathname={pathname} />
          <span className="font-sans text-sm text-[#0F766E] font-medium tracking-wide">
            {message}
          </span>
        </div>

        {/* Boot Sequence */}
        <div className="w-full pl-4 border-l border-border/60 ml-4 py-1">
          <BootSequence />
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <ProgressBar />
        </div>
        
      </motion.div>
    </div>
  );
}
