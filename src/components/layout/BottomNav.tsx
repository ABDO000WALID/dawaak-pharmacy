'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { PrescriptionUploadModal } from '@/components/prescriptions/PrescriptionUploadModal';
import { Modal } from '@/components/ui/Modal';
import { Home, LayoutGrid, FileText, ShoppingBag, User, ShieldCheck } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLocaleStore();
  const { getItemCount, hasHydrated } = useCartStore();

  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const cartItemCount = hasHydrated ? getItemCount() : 0;

  const navItems = [
    {
      id: 'home',
      labelAr: 'الرئيسية',
      labelEn: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      id: 'categories',
      labelAr: 'الأقسام',
      labelEn: 'Categories',
      href: '/#categories',
      icon: LayoutGrid,
      isActive: false,
    },
    {
      id: 'rx',
      labelAr: 'الروشتة',
      labelEn: 'Prescription',
      onClick: () => setIsRxModalOpen(true),
      icon: FileText,
      isSpecial: true,
    },
    {
      id: 'cart',
      labelAr: 'السلة',
      labelEn: 'Cart',
      href: '/cart',
      icon: ShoppingBag,
      isActive: pathname === '/cart',
      badge: cartItemCount,
    },
    {
      id: 'account',
      labelAr: 'حسابي',
      labelEn: 'Account',
      onClick: () => setIsAccountModalOpen(true),
      icon: User,
      isActive: false,
    },
  ];

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-lg"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.onClick) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 active:scale-95 transition"
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.isSpecial && (
                      <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold font-cairo">
                    {locale === 'ar' ? item.labelAr : item.labelEn}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href!}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition active:scale-95 relative ${
                  item.isActive
                    ? 'text-teal-700 dark:text-teal-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center justify-center border border-white dark:border-slate-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-cairo">
                  {locale === 'ar' ? item.labelAr : item.labelEn}
                </span>
                {item.isActive && (
                  <span className="absolute top-0 w-8 h-0.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Prescription Upload Modal */}
      <PrescriptionUploadModal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
      />

      {/* Account / Personas Quick Drawer Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={locale === 'ar' ? 'الملف الشخصي للمريض' : 'Patient Profile'}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-extrabold text-xl flex items-center justify-center mx-auto border-2 border-teal-500">
            ع.إ
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-cairo">
              {locale === 'ar' ? 'الحاج إبراهيم (مريض مزمن)' : 'Hajj Ibrahim (Chronic Patient)'}
            </h4>
            <p className="text-xs text-slate-500">01012345678 — شبرا، القاهرة</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-start space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{locale === 'ar' ? 'الحالة المزمنة:' : 'Chronic Condition:'}</span>
              <span className="font-bold text-teal-700 dark:text-teal-400">{locale === 'ar' ? 'ضغط وسكر (النوع الثاني)' : 'Hypertension & Diabetes'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{locale === 'ar' ? 'طريقة الدفع المفضلة:' : 'Payment:'}</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{locale === 'ar' ? 'الدفع عند الاستلام (كاش)' : 'Cash on Delivery'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{locale === 'ar' ? 'حماية البيانات:' : 'Privacy:'}</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {locale === 'ar' ? 'قانون 151/2020' : 'Law 151/2020'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAccountModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition"
          >
            {locale === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </Modal>
    </>
  );
}
