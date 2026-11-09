'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SyntheticProduct } from '@/types/product';
import { formatEGP } from '@/lib/utils/currency';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { Badge } from '@/components/ui/Badge';
import { ActiveIngredientTag } from '@/components/ui/ActiveIngredientTag';
import { ShoppingBag, Check, ArrowRightLeft } from 'lucide-react';

interface ProductCardProps {
  product: SyntheticProduct;
  onOpenSubstitute?: (product: SyntheticProduct) => void;
}

export function ProductCard({ product, onOpenSubstitute }: ProductCardProps) {
  const { locale } = useLocaleStore();
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

  const currentPrice = product.salePriceEgp ?? product.priceEgp;
  const hasDiscount = !!product.salePriceEgp && product.salePriceEgp < product.priceEgp;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleSubstituteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenSubstitute) {
      onOpenSubstitute(product);
    }
  };

  return (
    <article className="group h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 hover:shadow-medical-lg hover:border-teal-400/60 dark:hover:border-teal-500/50 transition-all duration-200 relative overflow-hidden">
      <div>
        {/* Top Badges Strip */}
        <div className="flex items-center justify-between gap-1 mb-2.5 flex-wrap">
          <Badge variant={product.prescriptionRequired ? 'rx' : 'otc'} />
          {hasDiscount && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
              {locale === 'ar' ? 'خصم خاص' : 'Sale'}
            </span>
          )}
        </div>

        {/* Product Image / Package Preview */}
        <Link
          href={`/product/${product.id}`}
          className="block w-full aspect-[4/3] rounded-xl overflow-hidden relative mb-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60 group-hover:scale-[1.02] transition-transform duration-200"
          aria-label={locale === 'ar' ? product.nameAr : product.nameEn}
        >
          {/* SVG Package Visual */}
          <div className="w-full h-full flex items-center justify-center p-3">
            <Image
              src={product.images[0] || '/placeholders/default-medicine.svg'}
              alt={locale === 'ar' ? product.nameAr : product.nameEn}
              width={300}
              height={240}
              className="w-full h-full object-contain drop-shadow-sm"
              unoptimized
            />
          </div>
        </Link>

        {/* Active Ingredient Molecule Chip */}
        <div className="mb-2">
          <ActiveIngredientTag
            ingredientAr={product.activeIngredientAr}
            ingredientEn={product.activeIngredientEn}
            size="sm"
          />
        </div>

        {/* Commercial Names (Dual Language) */}
        <Link href={`/product/${product.id}`} className="block group-hover:text-teal-700 transition">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1 font-cairo">
            {locale === 'ar' ? product.nameAr : product.nameEn}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {locale === 'ar' ? product.nameEn : product.nameAr}
          </p>
        </Link>

        {/* Pack Size & Manufacturer */}
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{locale === 'ar' ? product.packSizeAr : product.packSize}</span>
          <span className="text-slate-400 truncate max-w-[120px]">
            {locale === 'ar' ? product.manufacturerAr : product.manufacturer}
          </span>
        </div>

        {/* Substitute Prompt if generic available */}
        {product.substituteId && (
          <button
            type="button"
            onClick={handleSubstituteClick}
            className="w-full mt-2.5 py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
          >
            <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
            <span>
              {locale === 'ar'
                ? `متوفر بديل مصري مطابق (وفر ${formatEGP(product.substituteSavingsEgp || 15, locale)})`
                : `Generic substitute available (Save ${formatEGP(product.substituteSavingsEgp || 15, locale)})`}
            </span>
          </button>
        )}
      </div>

      {/* Pricing and Add to Cart Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-base sm:text-lg text-teal-800 dark:text-teal-300 font-cairo">
              {formatEGP(currentPrice, locale)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatEGP(product.priceEgp, locale)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            {locale === 'ar' ? 'متوفر بالمخزن' : 'In stock'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={locale === 'ar' ? 'أضف للسلة' : 'Add to cart'}
          className={`h-9 px-3.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 font-cairo ${
            isAdded
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5 animate-in zoom-in" />
              <span>{locale === 'ar' ? 'تمت الإضافة' : 'Added'}</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'أضف للسلة' : 'Add'}</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
