"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  Calendar,
  Users,
  Bell,
  FileText,
  BarChart2,
  Loader2,
  Award,
} from "lucide-react";

interface ModuleIconProps {
  pathname: string;
}

export default function ModuleIcon({ pathname }: ModuleIconProps) {
  const path = pathname.toLowerCase();
  
  let Icon = Loader2;
  let animateProps = { rotate: 360 };
  let transitionProps: any = { duration: 2, repeat: Infinity, ease: "linear" };

  if (path.includes("/events")) {
    Icon = Calendar;
    animateProps = { rotate: 0 } as any;
    transitionProps = {};
  } else if (path.includes("/attendance")) {
    Icon = QrCode;
    animateProps = { rotate: 0 } as any;
    transitionProps = {};
  } else if (path.includes("/users")) {
    Icon = Users;
    animateProps = { rotate: 0 } as any;
    transitionProps = {};
  } else if (path.includes("/updates")) {
    Icon = Bell;
    animateProps = { rotate: [0, -10, 10, -10, 10, 0] } as any;
    transitionProps = { duration: 1, repeat: Infinity, repeatDelay: 1 };
  } else if (path.includes("/reports")) {
    Icon = FileText;
    animateProps = { rotate: 0 } as any;
    transitionProps = {};
  } else if (path.includes("/certificates")) {
    Icon = Award;
    animateProps = { rotate: 0 } as any;
    transitionProps = {};
  } else if (path === "/admin" || path === "/volunteer" || path === "/student") {
    Icon = BarChart2;
    animateProps = { rotate: 0 } as any;
    transitionProps = {};
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      className="text-muted-foreground w-5 h-5 flex items-center justify-center"
    >
      <motion.div animate={animateProps} transition={transitionProps}>
        <Icon size={20} strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
}
