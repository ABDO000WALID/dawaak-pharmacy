'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { formatEGP } from '@/lib/utils/currency';
import { DawaakOrder, getStoredOrders, clearStoredOrders } from '@/types/order';
import { Package, Truck, Calendar, MapPin, Phone, User, Trash2, Clock, CheckCircle2 } from 'lucide-react';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyOrdersModal({ isOpen, onClose }: MyOrdersModalProps) {
  const { locale } = useLocaleStore();
  const [orders, setOrders] = useState<DawaakOrder[]>([]);

  const loadOrders = () => {
    setOrders(getStoredOrders());
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      loadOrders();
    };

    window.addEventListener('dawaak_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dawaak_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleClearHistory = () => {
    if (confirm(locale === 'ar' ? 'هل أنت متأكد من رغبتك في حذف سجل الطلبات التجريبية؟' : 'Are you sure you want to clear your mock orders history?')) {
      clearStoredOrders();
      setOrders([]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locale === 'ar' ? 'طلباتي السابقة (المحاكاة)' : 'My Orders History (Simulation)'}
      maxWidth="xl"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {orders.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-cairo">
              {locale === 'ar' ? 'لا توجد طلبات سابقة حتى الآن' : 'No previous orders found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {locale === 'ar'
                ? 'الطلبات التي تؤكدها في وضع التشغيل المحلي ستظهر هنا برقم الطلب والتفاصيل الكاملة وموعد التوصيل.'
                : 'Orders confirmed in local simulation mode will appear here with their tracking ID, items, and delivery estimate.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {locale === 'ar' ? `إجمالي الطلبات: ${orders.length}` : `Total Orders: ${orders.length}`}
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'مسح السجل' : 'Clear History'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3 transition hover:shadow-md"
                >
                  {/* Order Header: ID, Badge, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-teal-700 dark:text-teal-400">
                        {order.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{locale === 'ar' ? order.status : order.statusEn}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{order.formattedTime || new Date(order.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Delivery Estimate */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200">
                    <Truck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      <strong>{locale === 'ar' ? 'موعد التوصيل المتوقع: ' : 'Expected Delivery: '}</strong>
                      {order.expectedDeliveryTime}
                    </span>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span dir="ltr">{order.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {locale === 'ar' ? order.governorateNameAr : order.governorateNameEn} — {order.streetAddress}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {locale === 'ar' ? `الأدوية المطلوبة (${order.quantities} علبة)` : `Ordered Items (${order.quantities} items)`}
                    </p>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                              <Image
                                src={item.image}
                                alt={locale === 'ar' ? item.nameAr : item.nameEn}
                                fill
                                sizes="32px"
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {locale === 'ar' ? item.nameAr : item.nameEn}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.quantity} × {formatEGP(item.unitPrice, locale)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                            {formatEGP(item.totalPrice, locale)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <div className="text-slate-500 dark:text-slate-400 space-x-2 rtl:space-x-reverse">
                      <span>{locale === 'ar' ? 'التوصيل:' : 'Shipping:'} {formatEGP(order.shippingFee, locale)}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-xs text-slate-500 dark:text-slate-400 me-2">
                        {locale === 'ar' ? 'الإجمالي:' : 'Grand Total:'}
                      </span>
                      <strong className="text-sm font-extrabold text-teal-700 dark:text-teal-400">
                        {formatEGP(order.grandTotal, locale)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
