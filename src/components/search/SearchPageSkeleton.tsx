'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export interface SearchPageSkeletonProps {
  cardCount?: number;
}

/**
 * Shimmering dual-theme skeleton loader replacing blank screens during search transitions
 * and as React Suspense fallback for /search.
 */
export function SearchPageSkeleton({ cardCount = 8 }: SearchPageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="جاري تحميل الكتالوج والنتائج..."
      className="space-y-6 pb-12 animate-in fade-in duration-200"
    >
      {/* Screen-reader live region */}
      <span className="sr-only">جاري تحميل نتائج البحث وفلاتر الأدوية...</span>

      {/* Breadcrumb Skeleton */}
      <nav aria-label="Breadcrumb Skeleton" className="flex items-center gap-2">
        <Skeleton className="w-12 h-3.5 rounded-lg" />
        <Skeleton className="w-3.5 h-3.5 rounded-full" />
        <Skeleton className="w-20 h-3.5 rounded-lg" />
        <Skeleton className="w-3.5 h-3.5 rounded-full" />
        <Skeleton className="w-28 h-3.5 rounded-lg" />
      </nav>

      {/* Query Header & Controls Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="w-48 sm:w-64 h-6 sm:h-7 rounded-xl" />
          <Skeleton className="w-36 h-3.5 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-4 rounded-lg hidden sm:block" />
          <Skeleton className="w-36 sm:w-44 h-9 rounded-xl" />
        </div>
      </div>

      {/* Category Chips Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-hidden pb-1">
        <Skeleton className="w-20 h-8 rounded-xl shrink-0" />
        <Skeleton className="w-28 h-8 rounded-xl shrink-0" />
        <Skeleton className="w-24 h-8 rounded-xl shrink-0" />
        <Skeleton className="w-32 h-8 rounded-xl shrink-0" />
        <Skeleton className="w-28 h-8 rounded-xl shrink-0" />
        <Skeleton className="w-24 h-8 rounded-xl shrink-0" />
      </div>

      {/* Filter Action Bar Skeleton */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-8 rounded-xl" />
          <Skeleton className="w-20 h-8 rounded-xl" />
        </div>
        <Skeleton className="w-32 h-4 rounded-lg" />
      </div>

      {/* Product Cards Shimmer Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: cardCount }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 space-y-3 flex flex-col justify-between"
          >
            <div>
              {/* Top Badges */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-12 h-5 rounded-full" />
              </div>

              {/* Box Image Placeholder */}
              <Skeleton className="w-full aspect-[4/3] rounded-xl mb-3" />

              {/* Active Ingredient Tag */}
              <Skeleton className="w-24 h-4 rounded-md mb-2" />

              {/* Titles */}
              <div className="space-y-1.5 mb-2">
                <Skeleton className="w-4/5 h-4.5 rounded-lg" />
                <Skeleton className="w-3/5 h-3.5 rounded-lg" />
              </div>

              {/* Dosage / Pack */}
              <Skeleton className="w-28 h-3 rounded-md mb-2" />
            </div>

            {/* Price & Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <Skeleton className="w-16 h-5 rounded-md" />
                <Skeleton className="w-10 h-3 rounded-md" />
              </div>
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Skeleton className="w-36 h-4 rounded-lg" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-9 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default SearchPageSkeleton;
