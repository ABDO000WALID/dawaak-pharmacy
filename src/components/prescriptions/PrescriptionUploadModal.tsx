'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { UploadCloud, FileText, CheckCircle2, ShieldCheck, Camera, Clock, AlertCircle } from 'lucide-react';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrescriptionUploadModal({ isOpen, onClose }: PrescriptionUploadModalProps) {
  const { locale } = useLocaleStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0].name);
      setFileError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError(
        locale === 'ar'
          ? 'يرجى اختيار وإرفاق صورة أو ملف الروشتة الطبية أولاً للمتابعة'
          : 'Please select and attach a prescription file first to proceed'
      );
      return;
    }

    setFileError(null);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedFile(null);
      onClose();
    }, 2500);
  };

  const handleClose = () => {
    setFileError(null);
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
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {locale === 'ar'
              ? 'يقوم الصيدلي المرخص الآن بمراجعة الروشتة وتجهيز الأدوية وسنتواصل معك عبر واتساب لتأكيد موعد التوصيل.'
              : 'Our licensed pharmacist is reviewing your prescription. We will contact you shortly.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>{locale === 'ar' ? 'خصوصية بياناتك الصحية محمية بقانون 151 لسنة 2020' : 'Health data protected under Egyptian Law 151/2020'}</span>
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
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative ${
              fileError
                ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-200 dark:ring-rose-900/40'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-teal-500'
            }`}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleSimulatedUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload prescription"
            />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-2">
                <Camera className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 font-cairo">
                {selectedFile
                  ? selectedFile
                  : (locale === 'ar' ? 'صور الروشتة أو اختر ملف من جهازك' : 'Upload photo or PDF of prescription')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {locale === 'ar' ? 'ندعم صور الموبايل (JPG, PNG) وملفات PDF حتى 5 ميجابايت' : 'Supports JPG, PNG, PDF up to 5MB'}
              </p>
            </div>
          </div>

          {/* Patient Details Simulation */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {locale === 'ar' ? 'اسم المريض' : 'Patient Name'}
              </label>
              <input
                type="text"
                placeholder={locale === 'ar' ? 'مثال: عم إبراهيم' : 'e.g. Hajj Ibrahim'}
                defaultValue={locale === 'ar' ? 'عم إبراهيم' : 'Hajj Ibrahim'}
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {locale === 'ar' ? 'رقم الموبايل المصري' : 'Egyptian Mobile Number'}
              </label>
              <input
                type="tel"
                placeholder="010xxxxxxxx"
                defaultValue="01012345678"
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>{locale === 'ar' ? 'متوسط وقت الرد والمراجعة: 15 دقيقة' : 'Average verification time: 15 minutes'}</span>
          </div>

          {/* Action */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-sm shadow-md transition font-cairo"
            >
              {locale === 'ar' ? 'إرسال الروشتة للصيدلي الآن' : 'Submit Prescription'}
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
