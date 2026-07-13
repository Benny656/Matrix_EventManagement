"use client";

import React, { useEffect, useState } from "react";

export default function VolunteerClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-border px-3 py-1 bg-surface-container">
      SYS.TIME: <span className="text-foreground font-bold">{time || "00:00:00"}</span>
    </div>
  );
}
