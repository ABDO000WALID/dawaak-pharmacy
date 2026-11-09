'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types/product';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Pill,
  FileText,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

export interface FilterState {
  category?: string;
  prescription?: 'true' | 'false' | undefined;
  minPrice?: string;
  maxPrice?: string;
  activeIngredient?: string;
  sort?: string;
}

export interface SearchFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentFilters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  totalResultsCount?: number;
}

export function SearchFilterDrawer({
  isOpen,
  onClose,
  categories,
  currentFilters,
  onApplyFilters,
  onResetFilters,
  totalResultsCount,
}: SearchFilterDrawerProps) {
  const { locale } = useLocaleStore();

  // Local draft state while drawer is open
  const [draftCategory, setDraftCategory] = useState<string | undefined>(currentFilters.category);
  const [draftPrescription, setDraftPrescription] = useState<'true' | 'false' | undefined>(
    currentFilters.prescription
  );
  const [draftMinPrice, setDraftMinPrice] = useState<string>(currentFilters.minPrice || '');
  const [draftMaxPrice, setDraftMaxPrice] = useState<string>(currentFilters.maxPrice || '');
  const [draftActiveIngredient, setDraftActiveIngredient] = useState<string>(
    currentFilters.activeIngredient || ''
  );
  const [draftSort, setDraftSort] = useState<string>(currentFilters.sort || 'rating_desc');

  // Sync draft state whenever drawer opens or currentFilters prop updates
  useEffect(() => {
    if (isOpen) {
      setDraftCategory(currentFilters.category);
      setDraftPrescription(currentFilters.prescription);
      setDraftMinPrice(currentFilters.minPrice || '');
      setDraftMaxPrice(currentFilters.maxPrice || '');
      setDraftActiveIngredient(currentFilters.activeIngredient || '');
      setDraftSort(currentFilters.sort || 'rating_desc');
    }
  }, [isOpen, currentFilters]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({
      category: draftCategory,
      prescription: draftPrescription,
      minPrice: draftMinPrice.trim() ? draftMinPrice.trim() : undefined,
      maxPrice: draftMaxPrice.trim() ? draftMaxPrice.trim() : undefined,
      activeIngredient: draftActiveIngredient.trim() ? draftActiveIngredient.trim() : undefined,
      sort: draftSort,
    });
    onClose();
  };

  const handleReset = () => {
    setDraftCategory(undefined);
    setDraftPrescription(undefined);
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftActiveIngredient('');
    setDraftSort('rating_desc');
    onResetFilters();
    onClose();
  };

  const activeFiltersCount = [
    draftCategory,
    draftPrescription,
    draftMinPrice,
    draftMaxPrice,
    draftActiveIngredient,
    draftSort && draftSort !== 'rating_desc' ? draftSort : undefined,
  ].filter(Boolean).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex pl-0 rtl:pl-0 rtl:pr-0">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-s border-slate-200 dark:border-slate-800 animate-in slide-in-from-right rtl:slide-in-from-left duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="filter-drawer-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100 font-cairo flex items-center gap-2"
                >
                  <span>{locale === 'ar' ? 'تصفية الأدوية' : 'Filter Medicines'}</span>
                  {activeFiltersCount > 0 && (
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-teal-700 text-white font-cairo">
                      {activeFiltersCount}
                    </span>
                  )}
                </h2>
                {typeof totalResultsCount === 'number' && (
                  <p className="text-xs text-slate-500 font-cairo">
                    {locale === 'ar'
                      ? `${totalResultsCount} صنف متطابق حتى الآن`
                      : `${totalResultsCount} items currently matching`}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={locale === 'ar' ? 'إغلاق الفلاتر' : 'Close filters'}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Scrollable Form Sections */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 scrollbar-thin">
            {/* 1. Prescription Status (OTC vs Rx) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{locale === 'ar' ? 'حالة الروشتة والتصريح الدوائي' : 'Prescription Status'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDraftPrescription(undefined)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-cairo transition border flex items-center justify-center gap-1.5 ${
                    draftPrescription === undefined
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-700/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {draftPrescription === undefined && <Check className="w-3.5 h-3.5" />}
                  <span>{locale === 'ar' ? 'الكل' : 'All'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraftPrescription('false')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-cairo transition border flex items-center justify-center gap-1.5 ${
                    draftPrescription === 'false'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-700/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {draftPrescription === 'false' && <Check className="w-3.5 h-3.5" />}
                  <span>{locale === 'ar' ? 'بدون روشتة OTC' : 'OTC Only'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraftPrescription('true')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-cairo transition border flex items-center justify-center gap-1.5 ${
                    draftPrescription === 'true'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-700/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {draftPrescription === 'true' && <Check className="w-3.5 h-3.5" />}
                  <span>{locale === 'ar' ? 'بروشتة Rx' : 'Rx Only'}</span>
                </button>
              </div>
            </div>

            {/* 2. Price Range (min & max in EGP) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{locale === 'ar' ? 'نطاق السعر (بالجنيه المصري)' : 'Price Range (EGP)'}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-slate-500 font-cairo mb-1">
                    {locale === 'ar' ? 'الحد الأدنى' : 'Min Price'}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      placeholder="0"
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 font-cairo"
                    />
                    <span className="absolute end-3 top-2.5 text-[11px] font-bold text-slate-400">
                      {locale === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-500 font-cairo mb-1">
                    {locale === 'ar' ? 'الحد الأقصى' : 'Max Price'}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="300"
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 font-cairo"
                    />
                    <span className="absolute end-3 top-2.5 text-[11px] font-bold text-slate-400">
                      {locale === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Category Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{locale === 'ar' ? 'القسم الصيدلي' : 'Pharmacy Department'}</span>
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setDraftCategory(undefined)}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold font-cairo transition border flex items-center justify-between ${
                    draftCategory === undefined
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-800 dark:text-teal-300 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{locale === 'ar' ? 'كل الأقسام الدوائية' : 'All Departments'}</span>
                  {draftCategory === undefined && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDraftCategory(draftCategory === cat.id ? undefined : cat.id)}
                    className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold font-cairo transition border flex items-center justify-between ${
                      draftCategory === cat.id
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-800 dark:text-teal-300 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{locale === 'ar' ? cat.nameAr : cat.nameEn}</span>
                    {draftCategory === cat.id && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Active Ingredient Search / Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{locale === 'ar' ? 'المادة الفعالة' : 'Active Ingredient'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'مثلاً: باراسيتامول، كافيين، ريلاكسوجين...' : 'e.g. Paracetamol, Caffeine...'}
                  value={draftActiveIngredient}
                  onChange={(e) => setDraftActiveIngredient(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 font-cairo"
                />
                {draftActiveIngredient && (
                  <button
                    type="button"
                    onClick={() => setDraftActiveIngredient('')}
                    className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 5. Sort Option */}
            <div className="space-y-2.5">
              <label
                htmlFor="drawer-sort-select"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-1.5"
              >
                <ArrowUpDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{locale === 'ar' ? 'ترتيب النتائج' : 'Sort Results'}</span>
              </label>
              <select
                id="drawer-sort-select"
                value={draftSort}
                onChange={(e) => setDraftSort(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 font-cairo"
              >
                <option value="rating_desc">{locale === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
                <option value="price_asc">{locale === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price_desc">{locale === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                <option value="name_asc">{locale === 'ar' ? 'الاسم أبجدياً' : 'Name: Alphabetical'}</option>
                <option value="relevance">{locale === 'ar' ? 'الأكثر تطابقاً' : 'Relevance'}</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition font-cairo flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{locale === 'ar' ? 'مسح الفلاتر' : 'Reset'}</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition font-cairo flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{locale === 'ar' ? 'تطبيق التصفية' : 'Apply Filters'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchFilterDrawer;
