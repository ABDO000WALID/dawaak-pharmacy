'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { EGYPTIAN_GOVERNORATES } from '@/lib/mock-data/governorates';
import { formatEGP } from '@/lib/utils/currency';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Clock,
  AlertCircle,
  Truck,
} from 'lucide-react';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrescriptionUploadModal({ isOpen, onClose }: PrescriptionUploadModalProps) {
  const { locale } = useLocaleStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [governorate, setGovernorate] = useState('cairo');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic delivery fee and grand total calculation based on selected governorate
  const selectedGov = EGYPTIAN_GOVERNORATES.find((g) => g.id === governorate) || EGYPTIAN_GOVERNORATES[0];
  const deliveryFee = selectedGov.deliveryFeeEgp;
  const grandTotal = deliveryFee; // Base delivery fee before pharmacist quotes medicines

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0].name);
      setFileError(null);
      if (errors.file) {
        setErrors((prev) => ({ ...prev, file: '' }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!selectedFile) {
      const msg =
        locale === 'ar'
          ? 'يرجى اختيار وإرفاق صورة أو ملف الروشتة الطبية أولاً للمتابعة'
          : 'Please select and attach a prescription file first to proceed';
      setFileError(msg);
      newErrors.file = msg;
    }

    if (!customerName.trim()) {
      newErrors.customerName =
        locale === 'ar' ? 'يرجى إدخال اسم المريض / العميل' : 'Customer name cannot be empty';
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
    setFileError(null);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedFile(null);
      setCustomerName('');
      setCustomerPhone('');
      setStreetAddress('');
      onClose();
    }, 2500);
  };

  const handleClose = () => {
    setFileError(null);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        locale === 'ar'
          ? 'صرف الروشتة الطبية أونلاين'
          : 'Prescription Dispensing Portal'
      }
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100 font-cairo">
            {locale === 'ar' ? 'تم استلام الروشتة بنجاح!' : 'Prescription Uploaded Successfully!'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {locale === 'ar'
              ? `يقوم الصيدلي المرخص الآن بمراجعة الروشتة وتجهيز الأدوية. رسوم التوصيل المقدرة لمحافظة ${selectedGov.nameAr} هي ${formatEGP(deliveryFee, locale)}.`
              : `Our licensed pharmacist is reviewing your prescription. Estimated delivery to ${selectedGov.nameEn} is ${formatEGP(deliveryFee, locale)}.`}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>
                {locale === 'ar'
                  ? 'خصوصية بياناتك الصحية محمية بقانون 151 لسنة 2020'
                  : 'Health data protected under Egyptian Law 151/2020'}
              </span>
            </div>
            <p className="text-[11px] text-teal-800 dark:text-teal-300">
              {locale === 'ar'
                ? 'يتم فحص الروشتة حصراً بواسطة صيدلي نقابي مرخص لضمان سلامة الجرعات وعدم تعارض الأدوية.'
                : 'Reviewed exclusively by a licensed Egyptian clinical pharmacist.'}
            </p>
          </div>

          {/* Validation Alert Box */}
          {fileError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{fileError}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <div>
            <div
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative ${
                fileError || errors.file
                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-200 dark:ring-rose-900/40'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-teal-500'
              }`}
            >
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleSimulatedUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label={locale === 'ar' ? 'إرفاق الروشتة الطبية' : 'Upload prescription'}
              />
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-1.5">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 font-cairo">
                  {selectedFile
                    ? selectedFile
                    : locale === 'ar'
                    ? 'صور الروشتة أو اختر ملف من جهازك'
                    : 'Upload photo or PDF of prescription'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {locale === 'ar'
                    ? 'ندعم صور الموبايل (JPG, PNG) وملفات PDF حتى 5 ميجابايت'
                    : 'Supports JPG, PNG, PDF up to 5MB'}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Details & Governorate */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {locale === 'ar' ? 'المحافظة' : 'Governorate'}
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {locale === 'ar' ? g.nameAr : g.nameEn} ({g.deliveryFeeEgp} {locale === 'ar' ? 'ج.م' : 'EGP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {locale === 'ar' ? 'رقم الموبايل المصري' : 'Egyptian Mobile Number'}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: '' }));
                  }}
                  placeholder="010xxxxxxxx"
                  aria-invalid={!!errors.customerPhone}
                  className={`w-full text-xs px-3 py-2 rounded-xl border ${
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
                {locale === 'ar' ? 'اسم المريض / المستلم' : 'Patient Name'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                }}
                placeholder={locale === 'ar' ? 'مثال: عم إبراهيم' : 'e.g. Hajj Ibrahim'}
                aria-invalid={!!errors.customerName}
                className={`w-full text-xs px-3 py-2 rounded-xl border ${
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
                {locale === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'}
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => {
                  setStreetAddress(e.target.value);
                  if (errors.streetAddress) setErrors((prev) => ({ ...prev, streetAddress: '' }));
                }}
                placeholder={
                  locale === 'ar'
                    ? 'مثال: 14 شارع النصر، المعادي، القاهرة'
                    : 'e.g. 14 El-Nasr St, Maadi'
                }
                aria-invalid={!!errors.streetAddress}
                className={`w-full text-xs px-3 py-2 rounded-xl border ${
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

          {/* Dynamic Shipping Fee & Grand Total Calculation */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  {locale === 'ar'
                    ? `مصاريف التوصيل (${selectedGov.nameAr}):`
                    : `Shipping to ${selectedGov.nameEn}:`}
                </span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatEGP(deliveryFee, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold">
              <span>{locale === 'ar' ? 'الإجمالي التقديري الأولي:' : 'Initial Estimated Total:'}</span>
              <span className="text-teal-700 dark:text-teal-400 font-extrabold text-sm">
                {formatEGP(grandTotal, locale)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">
              {locale === 'ar'
                ? '* سعر الأدوية يحدد بدقة بعد مراجعة الصيدلي للروشتة والتواصل لتأكيد البدائل المتاحة.'
                : '* Medicine costs calculated after pharmacist review and confirmation.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>
              {locale === 'ar'
                ? 'متوسط وقت الرد والمراجعة: 15 دقيقة'
                : 'Average verification time: 15 minutes'}
            </span>
          </div>

          {/* Action */}
          <div className="pt-1 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-sm shadow-md transition font-cairo"
            >
              {locale === 'ar'
                ? `إرسال الروشتة للصيدلي (${formatEGP(grandTotal, locale)})`
                : `Submit Prescription (${formatEGP(grandTotal, locale)})`}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
