"use client";

import { useState, useEffect } from "react";

const UI_STATE_PREFIX = "matrix_ui_";

/**
 * Custom hook to persist lightweight UI state (active tab, selected filter, etc.)
 * across browser reloads without making database reads.
 */
export function usePersistentUIState<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const storageKey = `${UI_STATE_PREFIX}${key}`;

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore JSON parse errors and return defaultValue
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Handle storage quota or privacy mode errors gracefully
    }
  }, [storageKey, state]);

  return [state, setState];
}

/**
 * Clears all stored UI state on logout or reset.
 */
export function clearAllUIState() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(UI_STATE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn("Failed to clear UI state:", err);
  }
}
