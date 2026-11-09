import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Accessible shimmering skeleton loader for async transitions.
 * Supports dual theme (light: bg-slate-200, dark: bg-slate-700/60).
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700/60 transition-colors ${className}`}
      {...props}
    />
  );
}
