'use client';

import React from 'react';
import { SyntheticProduct } from '@/types/product';
import { formatEGP } from '@/lib/utils/currency';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ShoppingBag, Check } from 'lucide-react';

interface StickyPurchaseBarProps {
  product: SyntheticProduct;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCart: () => void;
  isAdded: boolean;
}

export function StickyPurchaseBar({
  product,
  quantity,
  onIncrement,
  onDecrement,
  onAddToCart,
  isAdded,
}: StickyPurchaseBarProps) {
  const { locale } = useLocaleStore();
  const currentPrice = product.salePriceEgp ?? product.priceEgp;
  const totalPrice = currentPrice * quantity;

  return (
    <div className="md:hidden fixed bottom-16 inset-x-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-lg animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div>
          <span className="text-[10px] text-slate-500 block">
            {locale === 'ar' ? 'الإجمالي:' : 'Total:'}
          </span>
          <span className="font-black text-base text-teal-800 dark:text-teal-300 font-cairo">
            {formatEGP(totalPrice, locale)}
          </span>
        </div>

        <QuantityStepper
          quantity={quantity}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          max={product.maxOrderQuantity || 5}
          size="sm"
        />

        <button
          type="button"
          onClick={onAddToCart}
          className={`h-10 px-4 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 font-cairo ${
            isAdded
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 animate-in zoom-in" />
              <span>{locale === 'ar' ? 'تمت الإضافة' : 'Added'}</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>{locale === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
