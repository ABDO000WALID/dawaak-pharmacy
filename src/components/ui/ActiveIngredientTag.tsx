'use client';

import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';

interface ActiveIngredientTagProps {
  ingredientAr: string;
  ingredientEn: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ActiveIngredientTag({
  ingredientAr,
  ingredientEn,
  className = '',
  size = 'sm',
}: ActiveIngredientTagProps) {
  const { locale } = useLocaleStore();

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'
      } ${className}`}
      title={locale === 'ar' ? `المادة الفعالة: ${ingredientAr}` : `Active Ingredient: ${ingredientEn}`}
    >
      <FlaskConical className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'} text-teal-600 dark:text-teal-400 shrink-0`} />
      <span className="font-semibold truncate max-w-[240px]">
        {locale === 'ar' ? ingredientAr : ingredientEn}
      </span>
    </div>
  );
}
