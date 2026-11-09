'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { ShieldCheck, PhoneCall, Truck, CreditCard, HeartHandshake } from 'lucide-react';

export function Footer() {
  const { locale } = useLocaleStore();

  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs transition-colors mt-auto pb-16 md:pb-0">
      {/* Trust Badges Strip */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm font-cairo">
                {locale === 'ar' ? 'توصيل سريع لباب بيتك' : 'Fast Direct Delivery'}
              </p>
              <p className="text-[11px] text-slate-500">
                {locale === 'ar' ? 'شحن مجاني للطلبات فوق 300 ج.م' : 'Free delivery over 300 EGP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm font-cairo">
                {locale === 'ar' ? 'صلاحية وفحص معتمد' : 'Verified Shelf-Life'}
              </p>
              <p className="text-[11px] text-slate-500">
                {locale === 'ar' ? 'صلاحية لا تقل عن 12 شهراً' : 'Guaranteed 12+ months expiry'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm font-cairo">
                {locale === 'ar' ? 'دفع آمن عند الاستلام' : 'Cash on Delivery & Wallets'}
              </p>
              <p className="text-[11px] text-slate-500">
                {locale === 'ar' ? 'كاش، إنستاباي، وفودافون كاش' : 'Cash, InstaPay, Mobile Wallets'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm font-cairo">
                {locale === 'ar' ? 'استشارة صيدلي 24/7' : '24/7 Pharmacist Support'}
              </p>
              <p className="text-[11px] text-slate-500">
                {locale === 'ar' ? 'الخط الساخن: 19888 (محاكاة)' : 'Hotline: 19888 (Simulated)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Regulatory Disclaimers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-3">
            <BrandLogo size="md" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              {locale === 'ar'
                ? 'منصة صيدلية إلكترونية متطورة مصممة خصيصاً للمستهلك المصري. نجمع بين أمان الصيدلية التقليدية وسرعة التكنولوجيا الحديثة لتوفير دوائك وبدائله بأسعار عادلة.'
                : 'Advanced digital pharmacy platform tailored for the Egyptian consumer. Combining apothecaric trust with modern delivery speed and generic price transparency.'}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 font-cairo text-sm">
              {locale === 'ar' ? 'أقسام الأدوية' : 'Categories'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/?category=analgesics-pain" className="hover:text-teal-700 transition">
                  {locale === 'ar' ? 'مسكنات وخافضات حرارة' : 'Analgesics & Pain'}
                </Link>
              </li>
              <li>
                <Link href="/?category=respiratory-cough" className="hover:text-teal-700 transition">
                  {locale === 'ar' ? 'الجهاز التنفسي والكحة' : 'Respiratory & Cough'}
                </Link>
              </li>
              <li>
                <Link href="/?category=digestive-health" className="hover:text-teal-700 transition">
                  {locale === 'ar' ? 'الجهاز الهضمي والقولون' : 'Digestive & GI'}
                </Link>
              </li>
              <li>
                <Link href="/?category=chronic-care" className="hover:text-teal-700 transition">
                  {locale === 'ar' ? 'الأمراض المزمنة والضغط' : 'Chronic Care & Cardio'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 font-cairo text-sm">
              {locale === 'ar' ? 'طرق الدفع المصرية' : 'Egyptian Payment Rails'}
            </h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold">
                💵 الدفع كاش عند الاستلام
              </span>
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-purple-700 dark:text-purple-400">
                ⚡ InstaPay إنستاباي
              </span>
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-red-600 dark:text-red-400">
                📱 فودافون كاش
              </span>
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-blue-600 dark:text-blue-400">
                💳 ميزة وبطاقات بنكية
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Simulation Mandate Notice */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-center text-[11px] text-slate-400 space-y-1">
          <p>
            {locale === 'ar'
              ? 'تنبيه قانوني: هذا التطبيق نموذج تقني تجريبي لأغراض المحاكاة والتطوير البرمجي فقط. جميع الأسماء التجارية والمواد الفعالة تركيبية وافتراضية.'
              : 'Legal Notice: This application is a technical educational prototype. All trade names and active molecules are strictly synthetic simulation data.'}
          </p>
          <p>
            {locale === 'ar'
              ? '© 2026 دواك - صيدلية إلكترونية مصرية. جميع الحقوق محفوظة لأغراض التطوير البرمجي.'
              : '© 2026 Dawaak - Egyptian Online Pharmacy Prototype. All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
