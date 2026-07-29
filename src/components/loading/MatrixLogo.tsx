"use client";

import React from "react";
import { motion } from "framer-motion";

export default function MatrixLogo() {
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      {/* Outer Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "rgba(20,184,166,0.15)", filter: "blur(12px)" }}
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Container scales from 0.96 to 1 and fades in */}
      <motion.div
        className="relative flex items-center justify-center w-full h-full"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full text-[#14B8A6]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Inner Rotating Ring */}
          <motion.circle
            cx="32"
            cy="32"
            r="24"
            strokeDasharray="40 10 20 10"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center" }}
            strokeOpacity={0.4}
          />
          
          {/* Static Outer Ring */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Center M Shape drawn out */}
          <motion.path
            d="M 22 42 L 22 22 L 32 34 L 42 22 L 42 42"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
