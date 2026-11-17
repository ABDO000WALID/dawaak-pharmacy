'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { ProductService } from '@/lib/services/product-service';
import { SyntheticProduct } from '@/types/product';
import {
  ScanLine,
  Camera,
  CameraOff,
  AlertCircle,
  CheckCircle2,
  Barcode,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export type ScannerState =
  | 'PERMISSION_PROMPT'
  | 'CAMERA_INITIALIZING'
  | 'SCANNING_ACTIVE'
  | 'DETECTED_SUCCESS'
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'UNSUPPORTED_FALLBACK';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_SKUS = [
  { sku: 'EGY-SYN-001', nameAr: 'سينترافول إكسترا', nameEn: 'Syntraphol Extra' },
  { sku: 'EGY-SYN-002', nameAr: 'فارماكيور شراب', nameEn: 'PharmaCure-DX Syrup' },
  { sku: 'EGY-SYN-003', nameAr: 'إيجيبتوكالم فوار', nameEn: 'EgyptoCalm Effervescent' },
  { sku: 'EGY-SYN-004', nameAr: 'جاستروشيلد كبسول', nameEn: 'GastroShield-M Capsules' },
];

export function BarcodeScannerModal({ isOpen, onClose }: BarcodeScannerModalProps) {
  const router = useRouter();
  const { locale } = useLocaleStore();

  const [scannerState, setScannerState] = useState<ScannerState>('PERMISSION_PROMPT');
  const [manualInput, setManualInput] = useState<string>('');
  const [detectedProduct, setDetectedProduct] = useState<SyntheticProduct | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannerState('PERMISSION_PROMPT');
      setDetectedProduct(null);
      setErrorMessage('');
      setManualInput('');
    }
  }, [isOpen, stopCamera]);

  // Audio feedback for successful detection
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not permitted or supported
    }
  };

  // Lookup product in catalog by scanned code (SKU, ID, or numbers)
  const lookupProduct = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const allProducts = ProductService.getAllProducts();

    const match = allProducts.find(
      (p) =>
        p.sku?.toUpperCase() === cleanCode ||
        p.id.toUpperCase() === cleanCode ||
        p.slug.toUpperCase() === cleanCode ||
        cleanCode.includes(p.sku?.toUpperCase() || 'XYZNOTFOUND')
    );

    if (match) {
      playBeep();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80]);
      }
      setDetectedProduct(match);
      setScannerState('DETECTED_SUCCESS');
      stopCamera();
    } else {
      setErrorMessage(
        locale === 'ar'
          ? `ملقيناش دواء مسجل بالباركود ده (${cleanCode}). اتأكد من الرقم أو ابحث باسم الدواء.`
          : `No product registered under barcode (${cleanCode}). Please verify code or search by name.`
      );
    }
  };

  // Start native camera scanning loop
  const startCamera = async () => {
    // Check if BarcodeDetector is available
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (!hasGetUserMedia) {
      setScannerState('CAMERA_UNAVAILABLE');
      return;
    }

    if (!hasBarcodeDetector) {
      // Browser doesn't support native BarcodeDetector (e.g. Safari / Firefox)
      setScannerState('UNSUPPORTED_FALLBACK');
      return;
    }

    try {
      setScannerState('CAMERA_INITIALIZING');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScannerState('SCANNING_ACTIVE');
        startBarcodeDetectionLoop();
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setScannerState('PERMISSION_DENIED');
      } else {
        setScannerState('CAMERA_UNAVAILABLE');
      }
    }
  };

  // Continuous frame detection loop
  const startBarcodeDetectionLoop = () => {
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: new (options?: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    if (!BarcodeDetectorClass || !videoRef.current) return;

    const detector = new BarcodeDetectorClass({
      formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
    });

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          lookupProduct(rawValue);
          return;
        }
      } catch {
        // Frame skipped
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    lookupProduct(manualInput);
  };

  const handleGoToProduct = () => {
    if (!detectedProduct) return;
    onClose();
    router.push(`/product/${detectedProduct.id}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={locale === 'ar' ? 'مسح باركود الدواء الذكي' : 'Smart Barcode Scanner'}
      maxWidth="md"
    >
      <div className="py-2 space-y-4">
        {/* 1. STATE: PERMISSION PROMPT (Transparent Consent & No Health Storage) */}
        {scannerState === 'PERMISSION_PROMPT' && (
          <div className="text-center space-y-5 py-3">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 mx-auto flex items-center justify-center shadow-sm">
              <ScanLine className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto font-cairo">
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                {locale === 'ar' ? 'كاميرا قراءة باركود الدواء' : 'Instant Medicine Barcode Reader'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {locale === 'ar'
                  ? 'هنفتح الكاميرا عشان تقرأ باركود علبة الدواء ونجيبهالك في ثانية ببياناتها وأسعارها وبدائلها. مش بنسجل ولا بنحفظ أي صور أو فيديو على أي سيرفر إطلاقاً — المعالجة بتتم في جهازك مباشرة طبقاً لمعايير الخصوصية.'
                  : 'Point your camera at any medicine box barcode to view full information and savings. No video or images are stored or sent to any server; scanning runs locally.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-2 max-w-sm mx-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locale === 'ar' ? 'حماية بياناتك الصحية أولوية قصوى' : 'Your health privacy is strictly protected'}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 font-cairo">
              <button
                type="button"
                onClick={startCamera}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>{locale === 'ar' ? 'سماح للكاميرا ومسح الباركود' : 'Allow Camera & Scan'}</span>
              </button>
              <button
                type="button"
                onClick={() => setScannerState('UNSUPPORTED_FALLBACK')}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
              >
                <span>{locale === 'ar' ? 'كتابة الكود يدوياً' : 'Enter Code Manually'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2 & 3. STATE: CAMERA INITIALIZING / SCANNING ACTIVE */}
        {(scannerState === 'CAMERA_INITIALIZING' || scannerState === 'SCANNING_ACTIVE') && (
          <div className="space-y-4">
            {/* Viewfinder Viewport */}
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-black overflow-hidden border-2 border-emerald-500/80 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {scannerState === 'CAMERA_INITIALIZING' ? (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-2 text-white font-cairo text-xs">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span>{locale === 'ar' ? 'بنجهّز الكاميرا الخلفية...' : 'Initializing Camera...'}</span>
                </div>
              ) : (
                <>
                  {/* Targeting corner reticles */}
                  <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none">
                    <div className="absolute top-0 start-0 w-6 h-6 border-t-2 border-s-2 border-emerald-400" />
                    <div className="absolute top-0 end-0 w-6 h-6 border-t-2 border-e-2 border-emerald-400" />
                    <div className="absolute bottom-0 start-0 w-6 h-6 border-b-2 border-s-2 border-emerald-400" />
                    <div className="absolute bottom-0 end-0 w-6 h-6 border-b-2 border-e-2 border-emerald-400" />
                    {/* Animated Emerald Laser Sweep Line */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34D399] animate-pulse top-1/2 -translate-y-1/2" />
                  </div>
                  <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                    <span className="px-3 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-sm font-cairo">
                      {locale === 'ar' ? 'وجّه الكاميرا لباركود علبة الدواء' : 'Align barcode within frame'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-cairo">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setScannerState('UNSUPPORTED_FALLBACK');
                }}
                className="text-teal-700 dark:text-teal-400 hover:underline font-bold flex items-center gap-1"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'تبديل للإدخال اليدوي' : 'Switch to Manual Entry'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* 4. STATE: DETECTED SUCCESS */}
        {scannerState === 'DETECTED_SUCCESS' && detectedProduct && (
          <div className="text-center space-y-4 py-2 font-cairo">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center animate-in zoom-in-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                {locale === 'ar' ? 'تم التعرف على الدواء بنجاح!' : 'Product Identified!'}
              </h3>
              <p className="text-xs text-emerald-600 font-bold">
                {locale === 'ar' ? 'بيانات المستحضر مطابقة للباركود' : 'Barcode matches verified catalog record'}
              </p>
            </div>

            {/* Product Snapshot Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-start space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {locale === 'ar' ? detectedProduct.nameAr : detectedProduct.nameEn}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {locale === 'ar' ? detectedProduct.nameEn : detectedProduct.nameAr}
                  </p>
                </div>
                <span className="font-black text-base text-teal-800 dark:text-teal-300">
                  {detectedProduct.salePriceEgp || detectedProduct.priceEgp} ج.م
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-500">{locale === 'ar' ? 'المادة الفعالة: ' : 'Active Molecule: '}</span>
                <span>{locale === 'ar' ? detectedProduct.activeIngredientAr : detectedProduct.activeIngredientEn}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleGoToProduct}
                className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{locale === 'ar' ? 'عرض تفاصيل الدواء والطلب' : 'View Product Details'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetectedProduct(null);
                  startCamera();
                }}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
              >
                {locale === 'ar' ? 'مسح علبة تانية' : 'Scan Another'}
              </button>
            </div>
          </div>
        )}

        {/* 5, 6 & 7. STATE: PERMISSION DENIED / CAMERA UNAVAILABLE / UNSUPPORTED FALLBACK */}
        {(scannerState === 'PERMISSION_DENIED' ||
          scannerState === 'CAMERA_UNAVAILABLE' ||
          scannerState === 'UNSUPPORTED_FALLBACK') && (
          <div className="space-y-4 font-cairo">
            {/* Advisory Alert Banner */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              {scannerState === 'PERMISSION_DENIED' ? (
                <CameraOff className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">
                  {scannerState === 'PERMISSION_DENIED'
                    ? locale === 'ar' ? 'تم رفض إذن الكاميرا' : 'Camera Access Denied'
                    : scannerState === 'CAMERA_UNAVAILABLE'
                    ? locale === 'ar' ? 'الكاميرا غير متوفرة' : 'Camera Unavailable'
                    : locale === 'ar' ? 'المتصفح لا يدعم قارئ الباركود التلقائي' : 'BarcodeDetector Not Supported'}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {scannerState === 'PERMISSION_DENIED'
                    ? locale === 'ar'
                      ? 'تقدر تسمح بالكاميرا من إعدادات المتصفح، أو تكتب كود الدواء يدوياً في الخانة بالأسفل.'
                      : 'Please enable camera permissions in settings or enter SKU below.'
                    : locale === 'ar'
                    ? 'اكتب كود الدواء أو الباركود المسجل على العلبة وهنطلعهولك في ثواني.'
                    : 'Enter barcode number or SKU manually to locate the item.'}
                </p>
              </div>
            </div>

            {/* Manual Barcode Input Form */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {locale === 'ar' ? 'أدخل كود الدواء أو أرقام الباركود:' : 'Enter SKU or Barcode:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => {
                    setManualInput(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder={
                    locale === 'ar'
                      ? 'اكتب مثلاً EGY-SYN-001 أو رقم الباركود...'
                      : 'e.g. EGY-SYN-001 or barcode number...'
                  }
                  className="w-full h-11 ps-10 pe-24 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
                <Barcode className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
                <button
                  type="submit"
                  className="absolute end-1.5 top-1.5 h-8 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition active:scale-95 flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  <span>{locale === 'ar' ? 'بحث' : 'Search'}</span>
                </button>
              </div>
            </form>

            {/* Error Message if not found */}
            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200">
                {errorMessage}
              </p>
            )}

            {/* Clickable Quick Sample SKU Chips */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                {locale === 'ar' ? 'أكواد تجريبية سريعة للتجربة:' : 'Sample SKUs for Instant Test:'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_SKUS.map((item) => (
                  <button
                    key={item.sku}
                    type="button"
                    onClick={() => lookupProduct(item.sku)}
                    className="p-2 text-start rounded-lg bg-slate-50 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 hover:border-teal-400 text-xs transition active:scale-95"
                  >
                    <span className="block font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      {locale === 'ar' ? item.nameAr : item.nameEn}
                    </span>
                    <span className="block font-mono text-[10px] text-teal-700 dark:text-teal-400">
                      {item.sku}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
