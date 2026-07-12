import React from "react";

interface LoadingSkeletonProps {
  message?: string;
}

export default function LoadingSkeleton({ message = "Querying matrix core..." }: LoadingSkeletonProps) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col justify-center items-center font-mono text-xs uppercase tracking-widest text-muted-foreground gap-4">
      {/* Premium Loader Ring */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Pulsing Outer Border */}
        <div className="absolute inset-0 border border-primary/20 rounded-sm animate-pulse"></div>
        {/* Rotating Inner Dash */}
        <div className="w-6 h-6 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div>
      </div>
      
      {/* Monospaced Loading Status */}
      <div className="flex flex-col items-center gap-1.5 animate-pulse">
        <span className="text-[10px] text-primary/80 font-bold tracking-widest">matrix // loading_segment</span>
        <span className="text-[11px] text-muted-foreground tracking-widest uppercase">{message}</span>
      </div>
    </div>
  );
}
