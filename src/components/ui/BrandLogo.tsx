'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleStore } from '@/lib/store/useLocaleStore';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  const { locale } = useLocaleStore();

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group transition-transform active:scale-95 ${className}`}
      aria-label="دواك - الصيدلية الإلكترونية"
    >
      {/* Scalable Vector Emblem */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-sm text-white shrink-0 ${iconSizes[size]}`}>
        {/* Medical Cross & Heart Motif */}
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6v12M6 12h12" />
        </svg>
        <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-teal-800 dark:text-teal-400 font-cairo ${titleSizes[size]}`}>
            {locale === 'ar' ? 'دواك' : 'Dawaak'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            {locale === 'ar' ? 'صيدلية' : 'Rx'}
          </span>
        </div>
        <span className="text-[9.5px] font-medium tracking-wide text-slate-500 dark:text-slate-400 uppercase mt-0.5">
          {locale === 'ar' ? 'صيدليتك في جيبك' : 'Online Pharmacy'}
        </span>
      </div>
    </Link>
  );
}
