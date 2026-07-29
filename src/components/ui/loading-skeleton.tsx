import React from "react";
import DashboardSkeleton from "../loading/DashboardSkeleton";

interface LoadingSkeletonProps {
  message?: string;
}

export default function LoadingSkeleton({ message }: LoadingSkeletonProps) {
  return <DashboardSkeleton />;
}
