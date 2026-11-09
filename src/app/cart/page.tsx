'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { ProductService } from '@/lib/services/product-service';
import { formatEGP } from '@/lib/utils/currency';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { ActiveIngredientTag } from '@/components/ui/ActiveIngredientTag';
import { DosageScheduleModal } from '@/components/cart/DosageScheduleModal';
import { CheckoutDrawer } from '@/components/cart/CheckoutDrawer';
import { SubstituteFinderModal } from '@/components/product/SubstituteFinderModal';
import { SyntheticProduct } from '@/types/product';
import {
  ShoppingBag,
  Trash2,
  Truck,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ArrowRightLeft,
  CheckCircle,
} from 'lucide-react';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    hasHydrated,
  } = useCartStore();

  const { locale } = useLocaleStore();

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [substituteTarget, setSubstituteTarget] = useState<SyntheticProduct | null>(null);

  const subtotal = hasHydrated ? getSubtotal() : 0;
  const deliveryFee = hasHydrated ? getDeliveryFee() : 25;
  const total = hasHydrated ? getTotal() : 0;

  const FREE_SHIPPING_THRESHOLD = 300;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const substituteProduct = substituteTarget?.substituteId
    ? ProductService.getSubstitute(substituteTarget.id)
    : undefined;

  // Empty cart view
  if (hasHydrated && items.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center max-w-lg mx-auto space-y-5 animate-in fade-in">
        <div className="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto border-2 border-teal-200 dark:border-teal-800/60 shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-cairo">
            {locale === 'ar' ? 'سلة مشترياتك فارغة حالياً' : 'Your Shopping Cart is Empty'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {locale === 'ar'
              ? 'صيدليتك في جيبك.. ابدأ بإضافة أدويتك ومستلزماتك الصحية واستفد من البدائل المصرية الموفّرة.'
              : 'Browse our genuine catalog to find essential medications and generic cost-savers.'}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-sm shadow-md transition font-cairo"
          >
            <span>{locale === 'ar' ? 'تصفح الأدوية والمنتجات' : 'Browse Medicines'}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Page Title & Clear Cart */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-cairo">
            {locale === 'ar' ? 'سلة المشتريات' : 'Your Shopping Cart'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === 'ar'
              ? `يوجد ${items.length} أدوية ومستحضرات في سلتك`
              : `${items.length} items currently in cart`}
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'تفريغ السلة' : 'Clear All'}</span>
          </button>
        )}
      </div>

      {/* Free Delivery Dynamic Progress Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800/80 border border-teal-200/80 dark:border-teal-900 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-cairo">
            <Truck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>
              {amountToFreeShipping === 0
                ? (locale === 'ar' ? 'مبروك! طلبك مؤهل للشحن المجاني 🚚🎉' : 'Congratulations! Free delivery unlocked 🚚🎉')
                : (locale === 'ar'
                  ? `أضف بـ ${formatEGP(amountToFreeShipping, locale)} للحصول على توصيل مجاني!`
                  : `Add ${formatEGP(amountToFreeShipping, locale)} more for FREE shipping!`)}
            </span>
          </div>
          <span className="text-teal-800 dark:text-teal-300 font-extrabold">{freeShippingProgress}%</span>
        </div>

        {/* Progress Tracker */}
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Two Column Layout: Cart Items List + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const currentPrice = item.product.salePriceEgp ?? item.product.priceEgp;
            const itemTotal = currentPrice * item.quantity;

            return (
              <div
                key={item.product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-teal-400/60"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Link
                    href={`/product/${item.product.id}`}
                    className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 p-1.5 shrink-0 border border-slate-100 dark:border-slate-800 flex items-center justify-center"
                  >
                    <Image
                      src={item.product.images[0] || '/placeholders/default-medicine.svg'}
                      alt={locale === 'ar' ? item.product.nameAr : item.product.nameEn}
                      width={64}
                      height={64}
                      className="max-h-full max-w-full object-contain"
                      unoptimized
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-teal-700 transition block truncate font-cairo"
                    >
                      {locale === 'ar' ? item.product.nameAr : item.product.nameEn}
                    </Link>

                    <div className="mt-1">
                      <ActiveIngredientTag
                        ingredientAr={item.product.activeIngredientAr}
                        ingredientEn={item.product.activeIngredientEn}
                        size="sm"
                      />
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>{locale === 'ar' ? item.product.packSizeAr : item.product.packSize}</span>
                      <span>•</span>
                      <span className="font-semibold text-teal-800 dark:text-teal-300">
                        {formatEGP(currentPrice, locale)} {locale === 'ar' ? '/ للعلبة' : '/ unit'}
                      </span>
                    </div>

                    {/* Generic Substitute Trigger if Available */}
                    {item.product.substituteId && (
                      <button
                        type="button"
                        onClick={() => setSubstituteTarget(item.product)}
                        className="mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>
                          {locale === 'ar'
                            ? `متوفر بديل مصري مطابق (وفر ${formatEGP(item.product.substituteSavingsEgp || 15, locale)})`
                            : `Generic alternative available (Save ${formatEGP(item.product.substituteSavingsEgp || 15, locale)})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Row Total */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <QuantityStepper
                    quantity={item.quantity}
                    onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)}
                    onDecrement={() => updateQuantity(item.product.id, item.quantity - 1)}
                    max={item.product.maxOrderQuantity || 5}
                    showTrashOnMin
                    size="sm"
                  />

                  <div className="text-end min-w-[80px]">
                    <span className="text-[10px] text-slate-400 block">{locale === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                    <span className="font-black text-sm sm:text-base text-teal-900 dark:text-teal-200 font-cairo">
                      {formatEGP(itemTotal, locale)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    aria-label={locale === 'ar' ? 'حذف المستحضر' : 'Remove item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Summary & Innovation Card */}
        <div className="space-y-4">
          {/* Order Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100 font-cairo">
              {locale === 'ar' ? 'ملخص الحساب والطلب' : 'Order Summary'}
            </h3>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>{locale === 'ar' ? 'مجموع أسعار الأدوية:' : 'Items Subtotal:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatEGP(subtotal, locale)}</span>
              </div>

              <div className="flex justify-between">
                <span>{locale === 'ar' ? 'مصاريف التوصيل للمنزل:' : 'Delivery Fee:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-black">{locale === 'ar' ? 'مجاني 🚚' : 'Free 🚚'}</span>
                  ) : (
                    formatEGP(deliveryFee, locale)
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline text-base font-black text-slate-900 dark:text-slate-100">
                <span>{locale === 'ar' ? 'الإجمالي المطلوب:' : 'Total Amount:'}</span>
                <span className="text-teal-800 dark:text-teal-300 text-lg font-cairo">
                  {formatEGP(total, locale)}
                </span>
              </div>
            </div>

            {/* Simulated Checkout CTA */}
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-black text-sm shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 font-cairo"
            >
              <span>{locale === 'ar' ? 'متابعة الشراء وتأكيد الطلب' : 'Proceed to Checkout'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>

            {/* Innovation Feature 2: Dosage Schedule Preview Trigger */}
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-bold text-xs transition flex items-center justify-center gap-2 font-cairo"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>{locale === 'ar' ? 'عرض جدول مواعيد الدواء الذكي 📅' : 'Smart Dosage Schedule Preview'}</span>
            </button>
          </div>

          {/* Egyptian Trust & Safety Notice */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 font-cairo">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{locale === 'ar' ? 'ضمانات دواك مصر' : 'Egyptian Care Guarantees'}</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside">
              <li>{locale === 'ar' ? 'الدفع كاش عند الاستلام بعد معاينة العلب' : 'Inspect package before paying cash'}</li>
              <li>{locale === 'ar' ? 'إمكانية الدفع بـ InstaPay أو فودافون كاش' : 'InstaPay & Mobile Wallets accepted'}</li>
              <li>{locale === 'ar' ? 'صلاحية الأدوية مضمونة لا تقل عن سنة' : 'Guaranteed 12+ months expiry'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Creative Feature 2 Modal: Dosage Schedule Organizer */}
      <DosageScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />

      {/* Simulated Checkout Drawer */}
      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Substitute Finder Modal */}
      {substituteTarget && (
        <SubstituteFinderModal
          isOpen={!!substituteTarget}
          onClose={() => setSubstituteTarget(null)}
          product={substituteTarget}
          substituteProduct={substituteProduct}
        />
      )}
    </div>
  );
}
