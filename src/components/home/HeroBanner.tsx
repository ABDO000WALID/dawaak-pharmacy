'use client';

import React, { useState } from 'react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { PrescriptionUploadModal } from '@/components/prescriptions/PrescriptionUploadModal';
import { ShieldCheck, Truck, Clock, Sparkles, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

export function HeroBanner() {
  const { locale } = useLocaleStore();
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white p-6 sm:p-10 shadow-medical-lg my-4">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 end-0 -mt-12 -me-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 start-0 -mb-12 -ms-12 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        {/* Cultural Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-4 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {locale === 'ar' ? 'صيدلية إلكترونية بروح مصرية' : 'Authentic Egyptian Care'}
          </span>
        </div>

        {/* Hero Slogan */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight sm:leading-relaxed font-cairo mb-3">
          {locale === 'ar' ? (
            <>
              صيدليتك في جيبك..
              <br />
              <span className="text-emerald-300">دواك يوصل لحد بابك</span>
            </>
          ) : (
            <>
              Your Pharmacy in Your Pocket..
              <br />
              <span className="text-emerald-300">Your Medicine at Your Door</span>
            </>
          )}
        </h1>

        <p className="text-xs sm:text-base text-slate-200/90 leading-relaxed max-w-xl mb-6">
          {locale === 'ar'
            ? 'احصل على أدويتك ومستلزماتك الصحية المعتمدة بأسعار عادلة وبدائل مصرية موفّرة. توصيل سريع ومتابعة دقيقة مع صيادلة متخصصين.'
            : 'Order genuine healthcare products and explore certified bioequivalent Egyptian generics with substantial savings.'}
        </p>

        {/* Actions Strip */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRxModalOpen(true)}
            className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-teal-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition flex items-center gap-2 font-cairo"
          >
            <FileText className="w-4 h-4" />
            <span>{locale === 'ar' ? 'عندك روشتة؟ ارفعها فوراً' : 'Upload Your Prescription'}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>

          <a
            href="#categories"
            className="h-12 px-5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-sm transition flex items-center gap-2 font-cairo"
          >
            <span>{locale === 'ar' ? 'تصفح أقسام الأدوية' : 'Browse Categories'}</span>
          </a>
        </div>

        {/* Trust Points */}
        <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/10 text-[11px] sm:text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{locale === 'ar' ? 'شحن لجميع المحافظات' : 'All Governorates'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{locale === 'ar' ? 'فحص جودة وصلاحية 100%' : '100% Quality Checked'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{locale === 'ar' ? 'كاش أو إنستاباي' : 'Cash or InstaPay'}</span>
          </div>
        </div>
      </div>

      <PrescriptionUploadModal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
      />
    </section>
  );
}
