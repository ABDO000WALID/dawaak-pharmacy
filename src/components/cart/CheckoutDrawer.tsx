'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { formatEGP } from '@/lib/utils/currency';
import { EGYPTIAN_GOVERNORATES } from '@/lib/mock-data/governorates';
import {
  Banknote,
  Smartphone,
  CreditCard,
  CheckCircle2,
  Truck,
  ShieldCheck,
  AlertCircle,
  QrCode,
} from 'lucide-react';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderSnapshotItem {
  id: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image: string;
  packSizeAr?: string;
  packSize?: string;
}

interface OrderSnapshot {
  orderNumber: string;
  items: OrderSnapshotItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  streetAddress: string;
  governorateNameAr: string;
  governorateNameEn: string;
  paymentMethod: 'cod' | 'instapay' | 'wallet';
  requiresRx: boolean;
  orderTime: string;
}

export function CheckoutDrawer({ isOpen, onClose }: CheckoutDrawerProps) {
  const { items, getSubtotal, getDeliveryFee, getTotal, clearCart, hasPrescriptionItems } = useCartStore();
  const { locale } = useLocaleStore();

  const [governorate, setGovernorate] = useState('cairo');
  const [streetAddress, setStreetAddress] = useState('14 شارع النصر، المعادي');
  const [customerName, setCustomerName] = useState('عم إبراهيم');
  const [customerPhone, setCustomerPhone] = useState('01012345678');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'instapay' | 'wallet'>('cod');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderSnapshot, setOrderSnapshot] = useState<OrderSnapshot | null>(null);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();
  const requiresRx = hasPrescriptionItems();

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedOrderNumber = `EG-PH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const govObj = EGYPTIAN_GOVERNORATES.find((g) => g.id === governorate);

    const snapshot: OrderSnapshot = {
      orderNumber: generatedOrderNumber,
      items: items.map((item) => {
        const unitPrice = item.product.salePriceEgp ?? item.product.priceEgp;
        return {
          id: item.product.id,
          nameAr: item.product.nameAr,
          nameEn: item.product.nameEn,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
          image: item.product.images[0] || '/placeholders/default-medicine.svg',
          packSizeAr: item.product.packSizeAr,
          packSize: item.product.packSize,
        };
      }),
      subtotal,
      deliveryFee,
      total,
      customerName,
      customerPhone,
      streetAddress,
      governorateNameAr: govObj?.nameAr || 'القاهرة',
      governorateNameEn: govObj?.nameEn || 'Cairo',
      paymentMethod,
      requiresRx,
      orderTime: new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setOrderSnapshot(snapshot);
    setOrderNumber(generatedOrderNumber);
    setIsSuccess(true);
    clearCart();
  };

  const handleFinish = () => {
    setIsSuccess(false);
    setOrderSnapshot(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSuccess ? handleFinish : onClose}
      title={
        isSuccess
          ? (locale === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order Placed Successfully!')
          : (locale === 'ar' ? 'إتمام الطلب وتحديد التوصيل' : 'Checkout & Delivery')
      }
      maxWidth="lg"
    >
      {isSuccess && orderSnapshot ? (
        <div className="py-4 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 font-cairo">
              {locale === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order Placed Successfully!'}
            </h3>
            <p className="text-xs text-slate-500">
              {locale === 'ar'
                ? `وقت تسجيل الطلب: ${orderSnapshot.orderTime}`
                : `Order placed at: ${orderSnapshot.orderTime}`}
            </p>
            <div className="pt-1">
              <span className="text-[11px] text-slate-500 block mb-1">
                {locale === 'ar' ? 'رقم الطلب التجريبي المرجعي' : 'Simulated Order Reference'}
              </span>
              <span className="inline-block px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 font-mono text-lg font-black text-teal-800 dark:text-teal-300 tracking-wider">
                {orderSnapshot.orderNumber}
              </span>
            </div>
          </div>

          {/* Recipient and Delivery Details */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-cairo">
              {locale === 'ar' ? 'بيانات المستلم والتوصيل' : 'Recipient & Delivery Details'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <span className="text-slate-500">{locale === 'ar' ? 'اسم المستلم:' : 'Recipient:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{orderSnapshot.customerName}</span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <span className="text-slate-500">{locale === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 dir-ltr">{orderSnapshot.customerPhone}</span>
              </div>
            </div>
            <div className="flex justify-between sm:justify-start sm:gap-2 pt-1">
              <span className="text-slate-500 shrink-0">{locale === 'ar' ? 'العنوان:' : 'Address:'}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {orderSnapshot.streetAddress}، {locale === 'ar' ? orderSnapshot.governorateNameAr : orderSnapshot.governorateNameEn}
              </span>
            </div>
            <div className="flex justify-between sm:justify-start sm:gap-2 pt-1">
              <span className="text-slate-500">{locale === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {orderSnapshot.paymentMethod === 'cod'
                  ? (locale === 'ar' ? 'الدفع كاش عند الاستلام' : 'Cash on Delivery')
                  : orderSnapshot.paymentMethod === 'instapay'
                  ? (locale === 'ar' ? 'InstaPay إنستاباي' : 'InstaPay QR')
                  : (locale === 'ar' ? 'محفظة فودافون كاش' : 'Vodafone Cash')}
              </span>
            </div>
            {orderSnapshot.requiresRx && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-[11px] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {locale === 'ar'
                    ? 'يحتوي طلبك على أدوية روشتة طبية. سيتصل بك الصيدلي هاتفياً للتحقق قبل إرسال المندوب.'
                    : 'Contains prescription items. Pharmacist verification call required before dispatch.'}
                </span>
              </div>
            )}
          </div>

          {/* Itemized Product List */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-cairo">
              {locale === 'ar' ? 'الأصناف المطلوبة' : 'Ordered Medicines'} ({orderSnapshot.items.length})
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto pr-1">
              {orderSnapshot.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-1 shrink-0 flex items-center justify-center">
                      <Image
                        src={item.image}
                        alt={locale === 'ar' ? item.nameAr : item.nameEn}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs font-cairo">
                        {locale === 'ar' ? item.nameAr : item.nameEn}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity} × {formatEGP(item.unitPrice, locale)}
                        {item.packSizeAr && (
                          <span className="text-slate-400 mx-1">
                            • {locale === 'ar' ? item.packSizeAr : item.packSize}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs shrink-0 font-cairo">
                    {formatEGP(item.totalPrice, locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-cairo">
              {locale === 'ar' ? 'ملخص التكاليف' : 'Cost Breakdown'}
            </h4>
            <div className="flex justify-between text-slate-500 pt-1">
              <span>{locale === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{formatEGP(orderSnapshot.subtotal, locale)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{locale === 'ar' ? 'مصاريف التوصيل:' : 'Delivery Fee:'}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {orderSnapshot.deliveryFee === 0
                  ? (locale === 'ar' ? 'مجاني' : 'Free')
                  : formatEGP(orderSnapshot.deliveryFee, locale)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>{locale === 'ar' ? 'الإجمالي النهائي المسدد:' : 'Total Paid:'}</span>
              <span className="text-teal-700 dark:text-teal-400 font-cairo text-base">
                {formatEGP(orderSnapshot.total, locale)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-3.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-sm font-cairo shadow-md transition"
          >
            {locale === 'ar' ? 'العودة لتصفح الصيدلية' : 'Continue Shopping'}
          </button>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          {requiresRx && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {locale === 'ar'
                  ? 'يحتوي طلبك على أدوية مقيدة بروشتة. سيتم التأكد من الوصفة الطبية مع الصيدلي عند التوصيل.'
                  : 'Contains prescription medication. Verification required upon delivery.'}
              </span>
            </div>
          )}

          {/* Delivery Address Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-cairo">
              {locale === 'ar' ? 'بيانات التوصيل والعنوان' : 'Delivery Address'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {locale === 'ar' ? 'المحافظة' : 'Governorate'}
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {locale === 'ar' ? g.nameAr : g.nameEn} ({g.deliveryFeeEgp} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {locale === 'ar' ? 'رقم الموبايل المصري' : 'Egyptian Mobile'}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="010xxxxxxxx"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {locale === 'ar' ? 'اسم المستلم' : 'Recipient Name'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {locale === 'ar' ? 'العنوان التفصيلي (الشارع، العمارة، الدور)' : 'Street, Building, Floor'}
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-cairo">
              {locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cod'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-[11px] font-cairo">
                  {locale === 'ar' ? 'الدفع كاش' : 'Cash (COD)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('instapay')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'instapay'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <QrCode className="w-5 h-5 text-purple-600" />
                <span className="text-[11px] font-cairo">
                  {locale === 'ar' ? 'InstaPay' : 'InstaPay'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'wallet'
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-5 h-5 text-red-600" />
                <span className="text-[11px] font-cairo">
                  {locale === 'ar' ? 'فودافون كاش' : 'Vodafone'}
                </span>
              </button>
            </div>
          </div>

          {/* Payment Preview Notice */}
          {paymentMethod === 'instapay' && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
              <div>
                <p className="font-bold">معرف إنستاباي: dawaak@instapay</p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300">يظهر رمز QR للمندوب عند الاستلام</p>
              </div>
              <QrCode className="w-8 h-8 text-purple-600" />
            </div>
          )}

          {/* Total Breakdown */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{locale === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span>{formatEGP(subtotal, locale)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{locale === 'ar' ? 'مصاريف التوصيل:' : 'Delivery Fee:'}</span>
              <span>{deliveryFee === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : formatEGP(deliveryFee, locale)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>{locale === 'ar' ? 'الإجمالي النهائي المطلوب:' : 'Grand Total:'}</span>
              <span className="text-teal-700 dark:text-teal-400 font-cairo text-base">
                {formatEGP(total, locale)}
              </span>
            </div>
          </div>

          {/* Place Order CTA */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-sm shadow-md transition font-cairo flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {locale === 'ar'
                ? `تأكيد الطلب التجريبي (${formatEGP(total, locale)})`
                : `Confirm Order (${formatEGP(total, locale)})`}
            </span>
          </button>
        </form>
      )}
    </Modal>
  );
}
