'use client';

import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';

interface QuantityStepperProps {
  quantity: number;
  max?: number;
  min?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  showTrashOnMin?: boolean;
  size?: 'sm' | 'md';
}

export function QuantityStepper({
  quantity,
  max = 5,
  min = 1,
  onIncrement,
  onDecrement,
  showTrashOnMin = false,
  size = 'md',
}: QuantityStepperProps) {
  const { locale } = useLocaleStore();
  const isMax = quantity >= max;
  const isMin = quantity <= min;

  const buttonSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-xs w-6' : 'text-sm w-8';

  return (
    <div className="flex flex-col items-center">
      <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-inner">
        <button
          type="button"
          onClick={onDecrement}
          aria-label={isMin && showTrashOnMin ? (locale === 'ar' ? 'حذف العنصر' : 'Remove item') : (locale === 'ar' ? 'إنقاص الكمية' : 'Decrease quantity')}
          className={`flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-teal-700 transition active:scale-90 ${buttonSize}`}
        >
          {isMin && showTrashOnMin ? (
            <Trash2 className="w-4 h-4 text-rose-500" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
        </button>

        <span
          className={`font-bold text-center text-slate-900 dark:text-slate-100 select-none ${textSize}`}
          aria-live="polite"
        >
          {quantity}
        </span>

        <button
          type="button"
          onClick={onIncrement}
          disabled={isMax}
          aria-label={locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
          title={isMax ? (locale === 'ar' ? 'الحد الأقصى 5 عبوات لمنع الاحتكار' : 'Maximum 5 units allowed') : undefined}
          className={`flex items-center justify-center rounded-lg transition ${buttonSize} ${
            isMax
              ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
              : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-teal-700 active:scale-90'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isMax && (
        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1">
          {locale === 'ar' ? 'سقف الطلب (5 عبوات)' : 'Max 5 units allowed'}
        </span>
      )}
    </div>
  );
}
