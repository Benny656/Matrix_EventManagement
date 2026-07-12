"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "./LoadingScreen";

/**
 * Wraps the app and holds the branded splash screen visible for a fixed
 * minimum duration on initial load, regardless of how fast the underlying
 * app is actually ready. This is a deliberate brand-moment choice, not a
 * performance pattern — do not reuse this gate for regular route
 * navigation, only the one-time initial app load.
 */

const SPLASH_DURATION_MS = 4000; // adjust anywhere in the 3000-5000 range

export default function AppSplashGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <LoadingScreen durationMs={SPLASH_DURATION_MS} />;
  }

  return <>{children}</>;
}
