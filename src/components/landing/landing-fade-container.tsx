"use client";

import React from "react";
import { motion } from "framer-motion";

export default function LandingFadeContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.75, ease: "easeOut" }}
      className="w-full min-h-screen flex flex-col"
    >
      {children}
    </motion.div>
  );
}
