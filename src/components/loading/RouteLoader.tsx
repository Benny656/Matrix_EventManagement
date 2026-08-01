"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MatrixLoadingScreen from "./MatrixLoadingScreen";
import { getLoadingMessage } from "./LoadingMessages";

export default function RouteLoader() {
  const pathname = usePathname() || "";
  const message = getLoadingMessage(pathname);
  return <MatrixLoadingScreen message={message} />;
}
