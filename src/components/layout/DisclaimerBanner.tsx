'use client';

import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';

export function DisclaimerBanner() {
  const { locale } = useLocaleStore();

  return (
    <aside
      aria-label="Legal & Medical Simulation Notice"
      className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-300/40 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 px-3 py-1.5 text-xs font-medium"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center flex-wrap">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          {locale === 'ar'
            ? 'تطبيق تجريبي للأغراض التعليمية والبرمجية — جميع بيانات الأدوية والمواد الفعالة تركيبية واختبارية (Simulation Only).'
            : 'Educational Simulation Platform — All pharmaceutical data and active ingredients are synthetic & simulated.'}
        </span>
      </div>
    </aside>
  );
}
