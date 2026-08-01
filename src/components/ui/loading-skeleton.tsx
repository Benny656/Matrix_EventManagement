"use client";

import React from "react";
import MatrixLoadingScreen from "@/components/loading/MatrixLoadingScreen";

interface LoadingSkeletonProps {
  message?: string;
}

export default function LoadingSkeleton({ message }: LoadingSkeletonProps) {
  return <MatrixLoadingScreen message={message} minDurationMs={1000} />;
}

