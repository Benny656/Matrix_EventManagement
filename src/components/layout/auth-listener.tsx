"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { clearPersistentCache } from "@/lib/swr-cache";
import { clearAllUIState } from "@/lib/use-ui-state";

let lastKnownUid: string | null = null;

export default function AuthListener() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (lastKnownUid && lastKnownUid !== user.uid) {
          // Different user logged in - clear previous user's cached data
          clearPersistentCache();
          clearAllUIState();
        }
        lastKnownUid = user.uid;

        try {
          const token = await user.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        } catch (err) {
          console.error("AuthListener background session sync error:", err);
        }
      } else {
        if (lastKnownUid) {
          // User logged out - clear cache
          clearPersistentCache();
          clearAllUIState();
          lastKnownUid = null;
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
