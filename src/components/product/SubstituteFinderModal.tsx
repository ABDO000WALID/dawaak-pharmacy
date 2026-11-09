'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { SyntheticProduct } from '@/types/product';
import { formatEGP } from '@/lib/utils/currency';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { ShieldCheck, ArrowRightLeft, Sparkles, CheckCircle2, TrendingDown } from 'lucide-react';

interface SubstituteFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SyntheticProduct;
  substituteProduct?: SyntheticProduct;
}

export function SubstituteFinderModal({
  isOpen,
  onClose,
  product,
  substituteProduct,
}: SubstituteFinderModalProps) {
  const { locale } = useLocaleStore();
  const { addItem, swapItem, items } = useCartStore();

  if (!substituteProduct) return null;

  const originalPrice = product.salePriceEgp ?? product.priceEgp;
  const substitutePrice = substituteProduct.salePriceEgp ?? substituteProduct.priceEgp;
  const savings = Math.max(0, originalPrice - substitutePrice);
  const savingsPercent = Math.round((savings / originalPrice) * 100);

  const isOriginalInCart = items.some((item) => item.product.id === product.id);

  const handleApplySubstitute = () => {
    if (isOriginalInCart) {
      swapItem(product.id, substituteProduct);
    } else {
      addItem(substituteProduct, 1);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        locale === 'ar'
          ? 'كاشف البديل الذكي ووفّر مع المصري 🇪🇬'
          : 'Smart Egyptian Generic Substitute & Saver'
      }
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Banner with savings */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <p className="font-bold text-sm md:text-base font-cairo">
                {locale === 'ar' ? 'وفر مع البديل المصري المعتمد!' : 'Save with Domestic Egyptian Generic!'}
              </p>
              <p className="text-xs text-emerald-100">
                {locale === 'ar'
                  ? 'مطابق حيوياً 100% بنفس المادة الفعالة والتركيز'
                  : '100% Bioequivalent with exact molecule & concentration'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <span className="inline-block text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 font-bold mb-0.5">
              {locale === 'ar' ? `وفر ${savingsPercent}%` : `Save ${savingsPercent}%`}
            </span>
            <p className="text-lg font-black">{formatEGP(savings, locale)}</p>
          </div>
        </div>

        {/* Side by side comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Original Product */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/40 relative">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {locale === 'ar' ? 'المستحضر الحالي (المستورد/المميز)' : 'Current Selection'}
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
              {locale === 'ar' ? product.nameAr : product.nameEn}
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'المصنّع:' : 'Manufacturer:'}
                </span>{' '}
                {locale === 'ar' ? product.manufacturerAr : product.manufacturer}
              </p>
              <p>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'المادة:' : 'Molecule:'}
                </span>{' '}
                {product.concentration}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
              <span className="text-xs text-slate-500">{locale === 'ar' ? 'السعر الحالي:' : 'Current Price:'}</span>
              <span className="font-bold text-base text-slate-700 dark:text-slate-300">
                {formatEGP(originalPrice, locale)}
              </span>
            </div>
          </div>

          {/* Substitute Product */}
          <div className="rounded-xl border-2 border-emerald-500 dark:border-emerald-600 p-4 bg-emerald-50/30 dark:bg-emerald-950/20 relative shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {locale === 'ar' ? 'البديل المصري المطابق' : 'Egyptian Bioequivalent'}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                {locale === 'ar' ? 'وفّر الآن' : 'Save'}
              </span>
            </div>
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 mb-2">
              {locale === 'ar' ? substituteProduct.nameAr : substituteProduct.nameEn}
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'المصنّع:' : 'Manufacturer:'}
                </span>{' '}
                {locale === 'ar' ? substituteProduct.manufacturerAr : substituteProduct.manufacturer}
              </p>
              <p>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? 'المادة:' : 'Molecule:'}
                </span>{' '}
                {substituteProduct.concentration} (100% مطابق)
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex items-baseline justify-between">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                {locale === 'ar' ? 'سعر البديل:' : 'Generic Price:'}
              </span>
              <span className="font-black text-lg text-emerald-700 dark:text-emerald-400">
                {formatEGP(substitutePrice, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* Bioequivalence Verification Checklist */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {locale === 'ar'
                ? 'نفس المادة الفعالة ونفس الشكل الصيدلي ونفس درجة الأمان والامتصاص'
                : 'Identical chemical entity, dosage form, efficacy, and safety profile'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {locale === 'ar'
                ? `توفر فوري بقيمة ${formatEGP(savings, locale)} في كل علبة`
                : `Instant savings of ${formatEGP(savings, locale)} on every package`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleApplySubstitute}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 font-cairo"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              {isOriginalInCart
                ? (locale === 'ar' ? 'استبدل في السلة ووفّر الآن' : 'Swap in Cart & Save Now')
                : (locale === 'ar' ? 'أضف البديل المصري للسلة ووفر' : 'Add Egyptian Generic & Save')}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
          >
            {locale === 'ar' ? 'احتفظ باختياري الحالي' : 'Keep Current Selection'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
