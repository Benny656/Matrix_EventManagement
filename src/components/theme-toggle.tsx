"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-container rounded-sm transition-colors flex items-center justify-center cursor-pointer"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </motion.div>
    </button>
  );
}
