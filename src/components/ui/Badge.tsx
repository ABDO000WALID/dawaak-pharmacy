'use client';

import React from 'react';
import { ShieldCheck, FileText, FlaskConical, Tag } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';

interface BadgeProps {
  variant: 'otc' | 'rx' | 'synthetic' | 'discount' | 'stock';
  text?: string;
  className?: string;
}

export function Badge({ variant, text, className = '' }: BadgeProps) {
  const { locale } = useLocaleStore();

  switch (variant) {
    case 'otc':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ${className}`}
        >
          <ShieldCheck className="w-3 h-3 shrink-0" />
          <span>{text ?? (locale === 'ar' ? 'بدون روشتة (OTC)' : 'OTC (General)')}</span>
        </span>
      );

    case 'rx':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700 ${className}`}
        >
          <FileText className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{text ?? (locale === 'ar' ? 'يتطلب روشتة طبية' : 'Rx Required')}</span>
        </span>
      );

    case 'synthetic':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800 ${className}`}
        >
          <FlaskConical className="w-3 h-3 shrink-0 text-teal-600 dark:text-teal-400" />
          <span>{text ?? (locale === 'ar' ? 'مركب تركيبي' : 'Synthetic Molecule')}</span>
        </span>
      );

    case 'discount':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
        >
          <Tag className="w-3 h-3 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{text ?? (locale === 'ar' ? 'عرض خاص' : 'Deal')}</span>
        </span>
      );

    case 'stock':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{text ?? (locale === 'ar' ? 'متوفر بالمخزن' : 'In Stock')}</span>
        </span>
      );

    default:
      return null;
  }
}
