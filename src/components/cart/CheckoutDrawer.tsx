'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { useCartStore } from '@/lib/store/useCartStore';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { formatEGP } from '@/lib/utils/currency';
import { EGYPTIAN_GOVERNORATES } from '@/lib/mock-data/governorates';
import { DawaakOrder, saveStoredOrder } from '@/types/order';
import {
  Banknote,
  Smartphone,
  CheckCircle2,
  Truck,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Clock,
} from 'lucide-react';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutDrawer({ isOpen, onClose }: CheckoutDrawerProps) {
  const { items, getSubtotal, clearCart, hasPrescriptionItems } = useCartStore();
  const { locale } = useLocaleStore();

  const [governorate, setGovernorate] = useState('cairo');
  const [streetAddress, setStreetAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'instapay' | 'wallet'>('cod');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<DawaakOrder | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic delivery fee and grand total calculation based on selected governorate
  const selectedGov = EGYPTIAN_GOVERNORATES.find((g) => g.id === governorate) || EGYPTIAN_GOVERNORATES[0];
  const subtotal = getSubtotal();
  const isFreeDelivery = subtotal >= 300 && subtotal > 0;
  const deliveryFee = isFreeDelivery ? 0 : (subtotal > 0 ? selectedGov.deliveryFeeEgp : 0);
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;
  const requiresRx = hasPrescriptionItems();

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName =
        locale === 'ar' ? 'يرجى إدخال اسم المستلم' : 'Customer name cannot be empty';
    }

    const cleanPhone = customerPhone.trim();
    if (!cleanPhone) {
      newErrors.customerPhone =
        locale === 'ar' ? 'يرجى إدخال رقم الهاتف' : 'Phone number cannot be empty';
    } else if (!/^01\d{9}$/.test(cleanPhone)) {
      newErrors.customerPhone =
        locale === 'ar'
          ? 'رقم الهاتف يجب أن يتكون من 11 رقماً ويبدأ بـ 01'
          : 'Phone number must be exactly 11 digits starting with "01"';
    }

    if (!streetAddress.trim()) {
      newErrors.streetAddress =
        locale === 'ar' ? 'يرجى إدخال العنوان بالتفصيل' : 'Address cannot be empty';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Generate Order ID in format #DWK-XXXX
    const generatedOrderNumber = `#DWK-${Math.floor(1000 + Math.random() * 9000)}`;

    const deliveryDays = selectedGov.deliveryDaysEstimated || 1;
    const expectedDeliveryTime =
      locale === 'ar'
        ? deliveryDays === 1
          ? 'خلال 24 ساعة (يوم واحد)'
          : `خلال ${deliveryDays} أيام عمل`
        : deliveryDays === 1
        ? 'Within 24 hours (1 business day)'
        : `Within ${deliveryDays} business days`;

    const newOrder: DawaakOrder = {
      id: generatedOrderNumber,
      orderId: generatedOrderNumber,
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
      quantities: items.reduce((sum, item) => sum + item.quantity, 0),
      governorate: selectedGov.id,
      governorateNameAr: selectedGov.nameAr,
      governorateNameEn: selectedGov.nameEn,
      shippingFee: deliveryFee,
      subtotal,
      grandTotal: total,
      total,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'قيد التجهيز',
      statusEn: 'In Preparation',
      expectedDeliveryTime,
      expectedDeliveryDays: deliveryDays,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      streetAddress: streetAddress.trim(),
      paymentMethod,
      requiresRx,
    };

    // Persist order details to localStorage under dawaak_mock_orders
    saveStoredOrder(newOrder);

    setOrderSnapshot(newOrder);
    setIsSuccess(true);
    // Note: clearCart() is deferred to confirmation dismissal (handleFinish)
  };

  const handleFinish = () => {
    clearCart();
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
          ? locale === 'ar'
            ? 'تم تأكيد طلبك بنجاح!'
            : 'Order Placed Successfully!'
          : locale === 'ar'
          ? 'إتمام الطلب وتحديد التوصيل'
          : 'Checkout & Delivery'
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
                ? `وقت تسجيل الطلب: ${orderSnapshot.formattedTime}`
                : `Order placed at: ${orderSnapshot.formattedTime}`}
            </p>
            <div className="pt-1 flex flex-col items-center gap-1.5">
              <span className="text-[11px] text-slate-500 block">
                {locale === 'ar' ? 'رقم الطلب التجريبي المرجعي' : 'Simulated Order Reference'}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 font-mono text-lg font-black text-teal-800 dark:text-teal-300 tracking-wider">
                  {orderSnapshot.id}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? orderSnapshot.status : orderSnapshot.statusEn}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Expected Delivery Time Card */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200">
            <Truck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              <strong className="font-cairo">
                {locale === 'ar' ? 'موعد التوصيل المتوقع: ' : 'Expected Delivery: '}
              </strong>
              {orderSnapshot.expectedDeliveryTime}
            </span>
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
                <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                  {orderSnapshot.customerPhone}
                </span>
              </div>
            </div>
            <div className="flex justify-between sm:justify-start sm:gap-2 pt-1">
              <span className="text-slate-500 shrink-0">{locale === 'ar' ? 'العنوان:' : 'Address:'}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {orderSnapshot.streetAddress}،{' '}
                {locale === 'ar' ? orderSnapshot.governorateNameAr : orderSnapshot.governorateNameEn}
              </span>
            </div>
            <div className="flex justify-between sm:justify-start sm:gap-2 pt-1">
              <span className="text-slate-500">{locale === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {orderSnapshot.paymentMethod === 'cod'
                  ? locale === 'ar'
                    ? 'الدفع كاش عند الاستلام'
                    : 'Cash on Delivery'
                  : orderSnapshot.paymentMethod === 'instapay'
                  ? locale === 'ar'
                    ? 'InstaPay إنستاباي'
                    : 'InstaPay QR'
                  : locale === 'ar'
                  ? 'محفظة فودافون كاش'
                  : 'Vodafone Cash'}
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
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto pe-1">
              {orderSnapshot.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      <Image
                        src={item.image}
                        alt={locale === 'ar' ? item.nameAr : item.nameEn}
                        fill
                        sizes="40px"
                        className="object-contain"
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
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {formatEGP(orderSnapshot.subtotal, locale)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{locale === 'ar' ? 'مصاريف التوصيل:' : 'Delivery Fee:'}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {orderSnapshot.shippingFee === 0
                  ? locale === 'ar'
                    ? 'مجاني'
                    : 'Free'
                  : formatEGP(orderSnapshot.shippingFee, locale)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>{locale === 'ar' ? 'الإجمالي النهائي المسدد:' : 'Total Paid:'}</span>
              <span className="text-teal-700 dark:text-teal-400 font-cairo text-base">
                {formatEGP(orderSnapshot.grandTotal, locale)}
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
        <form onSubmit={handlePlaceOrder} noValidate className="space-y-4">
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
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (errors.customerPhone) {
                      setErrors((prev) => ({ ...prev, customerPhone: '' }));
                    }
                  }}
                  placeholder="010xxxxxxxx"
                  aria-invalid={!!errors.customerPhone}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border ${
                    errors.customerPhone
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.customerPhone && (
                  <p
                    role="alert"
                    className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.customerPhone}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {locale === 'ar' ? 'اسم المستلم' : 'Recipient Name'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) {
                    setErrors((prev) => ({ ...prev, customerName: '' }));
                  }
                }}
                placeholder={locale === 'ar' ? 'مثال: عم إبراهيم' : 'e.g. Hajj Ibrahim'}
                aria-invalid={!!errors.customerName}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border ${
                  errors.customerName
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.customerName && (
                <p
                  role="alert"
                  className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.customerName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {locale === 'ar' ? 'العنوان التفصيلي (الشارع، العمارة، الدور)' : 'Street, Building, Floor'}
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => {
                  setStreetAddress(e.target.value);
                  if (errors.streetAddress) {
                    setErrors((prev) => ({ ...prev, streetAddress: '' }));
                  }
                }}
                placeholder={
                  locale === 'ar'
                    ? 'مثال: 14 شارع النصر، عمارة 5، الدور الثالث، المعادي'
                    : 'e.g. 14 El-Nasr St, Bldg 5, Floor 3, Maadi'
                }
                aria-invalid={!!errors.streetAddress}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border ${
                  errors.streetAddress
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.streetAddress && (
                <p
                  role="alert"
                  className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.streetAddress}</span>
                </p>
              )}
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
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  يظهر رمز QR للمندوب عند الاستلام
                </p>
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
              <span>
                {deliveryFee === 0
                  ? locale === 'ar'
                    ? 'مجاني'
                    : 'Free'
                  : formatEGP(deliveryFee, locale)}
              </span>
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
