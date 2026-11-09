'use client';

import React from 'react';
import { Category } from '@/types/product';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import {
  Pill,
  Wind,
  ShieldAlert,
  HeartPulse,
  Zap,
  Baby,
  Sparkles,
  Cross,
  CheckCircle,
} from 'lucide-react';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (categoryId: string | undefined) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Pill,
  Wind,
  ShieldAlert,
  HeartPulse,
  Zap,
  Baby,
  Sparkles,
  Cross,
};

export function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryChipsProps) {
  const { locale } = useLocaleStore();

  return (
    <section id="categories" className="my-6">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-cairo">
          {locale === 'ar' ? 'أقسام الأدوية والمستلزمات' : 'Browse by Category'}
        </h2>
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(undefined)}
            className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
          >
            {locale === 'ar' ? 'عرض جميع المنتجات' : 'View All'}
          </button>
        )}
      </div>

      {/* Grid on desktop, horizontal scroll on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* All Products Tile */}
        <button
          type="button"
          onClick={() => onSelectCategory(undefined)}
          className={`flex flex-col items-center min-h-[110px] justify-start pt-3 pb-2.5 px-2 rounded-2xl border text-center transition active:scale-95 ${
            selectedCategory === undefined
              ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-teal-400'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition ${
              selectedCategory === undefined
                ? 'bg-white/20 text-white'
                : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-center leading-tight break-words font-cairo">
            {locale === 'ar' ? 'الكل' : 'All'}
          </span>
        </button>

        {categories.map((category) => {
          const Icon = ICON_MAP[category.iconName] || Pill;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`flex flex-col items-center min-h-[110px] justify-start pt-3 pb-2.5 px-2 rounded-2xl border text-center transition active:scale-95 ${
                isSelected
                  ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-teal-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-center leading-tight break-words font-cairo">
                {locale === 'ar' ? category.nameAr : category.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
