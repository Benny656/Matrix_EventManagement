"use client";

import React from "react";
import { SWRConfig } from "swr";
import { createPersistentCacheProvider } from "./swr-cache";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: createPersistentCacheProvider,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 120000, // 2 minutes default deduplication
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
