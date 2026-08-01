import React from "react";
import MatrixLoadingScreen from "../loading/MatrixLoadingScreen";

interface LoadingSkeletonProps {
  message?: string;
}

export default function LoadingSkeleton({ message }: LoadingSkeletonProps) {
  return <MatrixLoadingScreen message={message} />;
}
