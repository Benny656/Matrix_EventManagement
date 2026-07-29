"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ProgressBar() {
  return (
    <div className="w-48 h-[2px] bg-muted/40 rounded-full overflow-hidden relative">
      <motion.div
        className="absolute inset-y-0 left-0 bg-[#14B8A6] rounded-full"
        initial={{ width: "0%", x: "-100%" }}
        animate={{ width: ["20%", "40%", "20%"], x: ["-100%", "250%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
