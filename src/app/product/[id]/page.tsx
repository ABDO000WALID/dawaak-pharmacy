'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ProductService } from '@/lib/services/product-service';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { formatEGP } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { ActiveIngredientTag } from '@/components/ui/ActiveIngredientTag';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { StickyPurchaseBar } from '@/components/product/StickyPurchaseBar';
import { SubstituteFinderModal } from '@/components/product/SubstituteFinderModal';
import {
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Check,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  Building2,
  Calendar,
  Clock,
  ChevronDown,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocaleStore();
  const { addItem } = useCartStore();

  const id = params?.id as string;

  const product = useMemo(() => {
    return ProductService.getProductById(id) || ProductService.getProductBySlug(id);
  }, [id]);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<'dosage' | 'warnings' | 'storage' | null>('dosage');

  if (!product) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-cairo">
          {locale === 'ar' ? 'لم يتم العثور على هذا الدواء' : 'Product Not Found'}
        </h2>
        <p className="text-xs text-slate-500">
          {locale === 'ar' ? 'قد يكون الرابط غير صحيح أو تم تحديث المستحضر.' : 'The requested pharmaceutical product does not exist.'}
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs"
        >
          {locale === 'ar' ? 'العودة للرئيسية' : 'Return Home'}
        </Link>
      </div>
    );
  }

  const substituteProduct = product.substituteId
    ? ProductService.getSubstitute(product.id)
    : undefined;

  const category = ProductService.getCategoryById(product.categoryId);
  const currentPrice = product.salePriceEgp ?? product.priceEgp;
  const hasDiscount = !!product.salePriceEgp && product.salePriceEgp < product.priceEgp;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(product.maxOrderQuantity || 5, prev + 1));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const toggleAccordion = (name: 'dosage' | 'warnings' | 'storage') => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const ChevronIcon = locale === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 font-medium">
        <Link href="/" className="hover:text-teal-700 transition">
          {locale === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5 text-slate-400" />
        <Link href={`/?category=${product.categoryId}`} className="hover:text-teal-700 transition">
          {locale === 'ar' ? category?.nameAr : category?.nameEn}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[200px]">
          {locale === 'ar' ? product.nameAr : product.nameEn}
        </span>
      </nav>

      {/* Main Product Showcase Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Product Image & Badges */}
        <div className="space-y-4">
          <div className="aspect-[4/3] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-center relative overflow-hidden">
            <Image
              src={product.images[0] || '/placeholders/default-medicine.svg'}
              alt={locale === 'ar' ? product.nameAr : product.nameEn}
              width={400}
              height={300}
              className="max-h-full max-w-full object-contain drop-shadow-md"
              unoptimized
            />
            {hasDiscount && (
              <span className="absolute top-4 start-4 text-xs font-black px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-sm">
                {locale === 'ar' ? 'خصم خاص' : 'Sale'}
              </span>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locale === 'ar' ? 'صلاحية لا تقل عن 12 شهر' : '12+ Months Expiry'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{locale === 'ar' ? 'توصيل مبرد ومحفوظ' : 'Temp-Controlled Dispatch'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Commercial Details & Purchase Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={product.prescriptionRequired ? 'rx' : 'otc'} />
              <Badge variant="synthetic" />
              <Badge variant="stock" />
            </div>

            {/* Title & Active Ingredient */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 font-cairo">
                {locale === 'ar' ? product.nameAr : product.nameEn}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {locale === 'ar' ? product.nameEn : product.nameAr}
              </p>
            </div>

            {/* Molecule Chip */}
            <div>
              <ActiveIngredientTag
                ingredientAr={product.activeIngredientAr}
                ingredientEn={product.activeIngredientEn}
                size="md"
              />
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">
                  {locale === 'ar' ? 'السعر الرسمي (شامل الضريبة):' : 'Retail Price (Tax incl.):'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-teal-900 dark:text-teal-200 font-cairo">
                    {formatEGP(currentPrice, locale)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatEGP(product.priceEgp, locale)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-end text-xs text-slate-500">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {locale === 'ar' ? product.packSizeAr : product.packSize}
                </span>
                <span>{locale === 'ar' ? product.dosageFormAr : product.dosageForm}</span>
              </div>
            </div>

            {/* Manufacturer & SKU */}
            <div className="text-xs text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{locale === 'ar' ? 'الشركة المصنعة:' : 'Manufacturer:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {locale === 'ar' ? product.manufacturerAr : product.manufacturer}
                </span>
              </p>
              <p>
                <span>{locale === 'ar' ? 'كود الصيدلية (SKU):' : 'SKU:'}</span>{' '}
                <span className="font-mono text-slate-600 dark:text-slate-400">{product.sku}</span>
              </p>
            </div>

            {/* Smart Substitute Finder Trigger Button */}
            {product.substituteId && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200 font-cairo">
                      {locale === 'ar' ? 'متوفر بديل مصري مطابق 100%' : '100% Bioequivalent Generic Available'}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400">
                      {locale === 'ar'
                        ? `وفر ${formatEGP(product.substituteSavingsEgp || 15, locale)} مع نفس المادة الفعالة`
                        : `Save ${formatEGP(product.substituteSavingsEgp || 15, locale)} with exact same active ingredient`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubstituteModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 shrink-0 font-cairo"
                >
                  {locale === 'ar' ? 'كاشف البديل ووفر' : 'View Substitute'}
                </button>
              </div>
            )}
          </div>

          {/* Desktop Purchase Action Bar */}
          <div className="hidden md:flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <QuantityStepper
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              max={product.maxOrderQuantity || 5}
            />

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 h-12 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95 font-cairo ${
                isAdded
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5 animate-in zoom-in" />
                  <span>{locale === 'ar' ? 'تمت الإضافة بنجاح إلى السلة' : 'Added to Cart Successfully'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>{locale === 'ar' ? 'أضف إلى سلة المشتريات' : 'Add to Cart'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Accordions: Indications, Dosage, Warnings & Storage */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-sm space-y-3">
        <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 font-cairo mb-4">
          {locale === 'ar' ? 'النشرة الطبية والمعلومات الدوائية' : 'Pharmaceutical Guide & Clinical Data'}
        </h3>

        {/* 1. Indications */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAccordion('dosage')}
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-start font-bold text-sm text-slate-800 dark:text-slate-200 font-cairo"
          >
            <span>{locale === 'ar' ? 'دواعي الاستعمال وطريقة الجرعة الموصى بها' : 'Indications & Dosage Instructions'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openAccordion === 'dosage' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openAccordion === 'dosage' && (
            <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed border-t border-slate-200 dark:border-slate-800">
              <p className="font-medium">
                {locale === 'ar' ? product.descriptionAr : product.descriptionEn}
              </p>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
                <span className="font-bold block mb-1 font-cairo">
                  {locale === 'ar' ? 'الجرعة المعتادة:' : 'Recommended Dosage:'}
                </span>
                <p>{locale === 'ar' ? product.dosageInstructionsAr : product.dosageInstructionsEn}</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Regulatory Warnings */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAccordion('warnings')}
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-start font-bold text-sm text-slate-800 dark:text-slate-200 font-cairo"
          >
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{locale === 'ar' ? 'التحذيرات والاحتياطات وموانع الاستعمال' : 'Warnings & Precautions'}</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openAccordion === 'warnings' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openAccordion === 'warnings' && (
            <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200 dark:border-slate-800">
              <ul className="list-disc list-inside space-y-1.5">
                {(locale === 'ar' ? product.warningsAr : product.warningsEn).map((w, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <p className="font-semibold">
                  {locale === 'ar'
                    ? '⚠️ تنبيه: استشر الطبيب أو الصيدلي دائماً قبل تناول هذا المستحضر، خاصة لمرضى الحساسية والنساء الحوامل.'
                    : '⚠️ Caution: Always consult your physician or clinical pharmacist prior to starting treatment.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. Storage Conditions */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAccordion('storage')}
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-start font-bold text-sm text-slate-800 dark:text-slate-200 font-cairo"
          >
            <span>{locale === 'ar' ? 'شروط التخزين وحفظ الدواء' : 'Storage & Preservation Guidelines'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openAccordion === 'storage' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openAccordion === 'storage' && (
            <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
              <p>{locale === 'ar' ? product.storageConditionsAr : product.storageConditions}</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                {locale === 'ar'
                  ? 'يتم تخزين جميع الأدوية في مستودعاتنا المركزية تحت رقابة حرارية آلية 24 ساعة.'
                  : 'All inventory is held under automated climate-controlled conditions.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Purchase Bar */}
      <StickyPurchaseBar
        product={product}
        quantity={quantity}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onAddToCart={handleAddToCart}
        isAdded={isAdded}
      />

      {/* Substitute Finder Modal */}
      {substituteProduct && (
        <SubstituteFinderModal
          isOpen={isSubstituteModalOpen}
          onClose={() => setIsSubstituteModalOpen(false)}
          product={product}
          substituteProduct={substituteProduct}
        />
      )}
    </div>
  );
}
