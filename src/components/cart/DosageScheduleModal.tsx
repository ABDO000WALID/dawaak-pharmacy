'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { Sun, Sunrise, Moon, Printer, Calendar, Pill, AlertCircle } from 'lucide-react';

interface DosageScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DosageScheduleModal({ isOpen, onClose }: DosageScheduleModalProps) {
  const { items } = useCartStore();
  const { locale } = useLocaleStore();
  const printableAreaRef = useRef<HTMLDivElement>(null);

  // Categorize medications into morning, noon, and night buckets
  const morningMeds = items.filter((item) => {
    const bucket = item.product.timingBucket ?? 'morning';
    return bucket === 'morning';
  });

  const noonMeds = items.filter((item) => {
    const bucket = item.product.timingBucket;
    return bucket === 'noon';
  });

  const nightMeds = items.filter((item) => {
    const bucket = item.product.timingBucket;
    return bucket === 'night';
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        locale === 'ar'
          ? 'جدول مواعيد الدواء الذكي 📅'
          : 'Smart Medication Dosage Schedule'
      }
      maxWidth="xl"
    >
      <div className="space-y-5" ref={printableAreaRef}>
        {/* Header Intro */}
        <div className="bg-teal-50 dark:bg-teal-950/40 rounded-xl p-3.5 border border-teal-200/80 dark:border-teal-800/60 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900 dark:text-teal-200">
            <p className="font-bold text-sm mb-0.5 font-cairo">
              {locale === 'ar'
                ? 'تنظيم مواعيد أدويتك لسلامتك والتزامك بالعلاج'
                : 'Organized daily dosage schedule for your safety'}
            </p>
            <p>
              {locale === 'ar'
                ? 'تم توزيع أدوية سلتك تلقائياً على فترات اليوم لتجنب التداخلات ولتسهيل المتابعة لك ولعائلتك.'
                : 'Your cart medications are organized into morning, afternoon, and evening slots to prevent interactions.'}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Pill className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
            <p>{locale === 'ar' ? 'سلتك فارغة، أضف أدوية لتوليد جدول الجرعات' : 'Your cart is empty. Add medicines to generate a schedule.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Morning Slot */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/70 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800/40">
                <Sunrise className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 font-cairo">
                  {locale === 'ar' ? '🌅 الصباح (مع الإفطار أو قبله)' : '🌅 Morning (With or Before Breakfast)'}
                </h4>
                <span className="ms-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 dark:text-amber-200">
                  {morningMeds.length} {locale === 'ar' ? 'أدوية' : 'meds'}
                </span>
              </div>
              <div className="p-3 divide-y divide-amber-100 dark:divide-amber-950">
                {morningMeds.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">{locale === 'ar' ? 'لا توجد أدوية مقررة صباحاً في سلتك' : 'No morning medications in cart'}</p>
                ) : (
                  morningMeds.map((item) => (
                    <div key={item.product.id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {locale === 'ar' ? item.product.nameAr : item.product.nameEn}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {locale === 'ar' ? item.product.dosageInstructionsAr : item.product.dosageInstructionsEn}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-800 dark:text-teal-300 shrink-0">
                        {locale === 'ar' ? item.product.dosageFormAr : item.product.dosageForm}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Noon / Afternoon Slot */}
            <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-100/70 dark:bg-sky-900/40 border-b border-sky-200 dark:border-sky-800/40">
                <Sun className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <h4 className="font-bold text-sm text-sky-900 dark:text-sky-200 font-cairo">
                  {locale === 'ar' ? '☀️ الظهر (بعد الغداء)' : '☀️ Noon (After Lunch)'}
                </h4>
                <span className="ms-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-200/60 text-sky-900 dark:text-sky-200">
                  {noonMeds.length} {locale === 'ar' ? 'أدوية' : 'meds'}
                </span>
              </div>
              <div className="p-3 divide-y divide-sky-100 dark:divide-sky-950">
                {noonMeds.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">{locale === 'ar' ? 'لا توجد أدوية مقررة ظهراً في سلتك' : 'No noon medications in cart'}</p>
                ) : (
                  noonMeds.map((item) => (
                    <div key={item.product.id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {locale === 'ar' ? item.product.nameAr : item.product.nameEn}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {locale === 'ar' ? item.product.dosageInstructionsAr : item.product.dosageInstructionsEn}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-800 dark:text-teal-300 shrink-0">
                        {locale === 'ar' ? item.product.dosageFormAr : item.product.dosageForm}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Night Slot */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100/70 dark:bg-indigo-900/40 border-b border-indigo-200 dark:border-indigo-800/40">
                <Moon className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200 font-cairo">
                  {locale === 'ar' ? '🌙 المساء (قبل النوم / بعد العشاء)' : '🌙 Night (Before Sleep / Dinner)'}
                </h4>
                <span className="ms-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-900 dark:text-indigo-200">
                  {nightMeds.length} {locale === 'ar' ? 'أدوية' : 'meds'}
                </span>
              </div>
              <div className="p-3 divide-y divide-indigo-100 dark:divide-indigo-950">
                {nightMeds.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">{locale === 'ar' ? 'لا توجد أدوية مقررة مساءً في سلتك' : 'No night medications in cart'}</p>
                ) : (
                  nightMeds.map((item) => (
                    <div key={item.product.id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {locale === 'ar' ? item.product.nameAr : item.product.nameEn}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {locale === 'ar' ? item.product.dosageInstructionsAr : item.product.dosageInstructionsEn}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-800 dark:text-teal-300 shrink-0">
                        {locale === 'ar' ? item.product.dosageFormAr : item.product.dosageForm}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Refill Timeline Callout */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              {locale === 'ar'
                ? 'تكفي هذه الكمية دورة علاجية لمدة 30 يوماً في المتوسط'
                : 'Current order supplies approximately 30 days of therapy'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 font-cairo"
          >
            <Printer className="w-4 h-4" />
            <span>{locale === 'ar' ? 'طباعة الجدول وعلقه على الثلاجة 🖨️' : 'Print Schedule for Refrigerator'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
          >
            {locale === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
