'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { Sparkles, Tag, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

export function PromoBanner() {
  const { locale } = useLocaleStore();
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className="my-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
      <div className="absolute top-0 end-0 -mt-6 -me-6 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{locale === 'ar' ? 'عرض فلاش لفترة محدودة' : 'Flash Sale'}</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black font-cairo">
            {locale === 'ar'
              ? 'وفّر 20% على باقة المناعة والنشاط اليومي'
              : 'Save 20% on Immunity & Vitality Packs'}
          </h3>

          <p className="text-xs sm:text-sm text-amber-50">
            {locale === 'ar'
              ? 'احصل على فيتابوست-ماكس وسليب-إيزي بتخفيض خاص مع شحن مجاني لأي مكان في مصر.'
              : 'Get VitaBoost-Max and SleepEasy-Synth with exclusive discount & free shipping.'}
          </p>
        </div>

        <Link
          href="/product/prod-syn-009"
          className="h-11 px-5 rounded-xl bg-white hover:bg-amber-50 active:scale-95 text-amber-900 font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0 font-cairo"
        >
          <Tag className="w-4 h-4 text-amber-600" />
          <span>{locale === 'ar' ? 'اطلب العرض الآن' : 'Claim Deal'}</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
