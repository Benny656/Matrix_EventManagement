"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MatrixLoader from "./MatrixLoader";

export default function RouteLoader() {
  const pathname = usePathname() || "";
  return <MatrixLoader pathname={pathname} />;
}
