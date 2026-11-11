'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SyntheticProduct } from '@/types/product';
import { MedicineBoxSvg, BoxFace } from './MedicineBoxSvg';
import { Rotate3d, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/useLocaleStore';

export interface MedicineBox3DProps {
  product: SyntheticProduct;
  className?: string;
}

export function MedicineBox3D({ product, className = '' }: MedicineBox3DProps) {
  const { locale } = useLocaleStore();

  // 3D rotation angles in degrees (default isometric view)
  const [rotX, setRotX] = useState<number>(-12);
  const [rotY, setRotY] = useState<number>(25);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeFaceName, setActiveFaceName] = useState<string>('منظور ثلاثي الأبعاد');

  // Accessibility / Reduced Motion mode toggle
  const [use2DFallback, setUse2DFallback] = useState<boolean>(false);
  const [selected2DFace, setSelected2DFace] = useState<BoxFace>('front');

  const startCoords = useRef<{ x: number; y: number; initialRotX: number; initialRotY: number }>({
    x: 0,
    y: 0,
    initialRotX: -12,
    initialRotY: 25,
  });

  // Check prefers-reduced-motion on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setUse2DFallback(true);
      }
    }
  }, []);

  // Pointer drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setIsDragging(true);
    startCoords.current = {
      x: e.clientX,
      y: e.clientY,
      initialRotX: rotX,
      initialRotY: rotY,
    };
  }, [rotX, rotY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startCoords.current.x;
      const deltaY = e.clientY - startCoords.current.y;

      // Map horizontal drag to Y-axis rotation (inverted for natural RTL feel)
      const newRotY = startCoords.current.initialRotY + deltaX * 0.55;
      // Map vertical drag to X-axis tilt clamped to -60..60 degrees
      const rawRotX = startCoords.current.initialRotX - deltaY * 0.55;
      const newRotX = Math.max(-60, Math.min(60, rawRotX));

      setRotX(newRotX);
      setRotY(newRotY);
      setActiveFaceName('تدوير حر');
    },
    [isDragging]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
  }, [isDragging]);

  // Quick preset angle buttons
  const setPreset = (name: string, targetX: number, targetY: number) => {
    setRotX(targetX);
    setRotY(targetY);
    setActiveFaceName(name);
  };

  // 2D Accessible Fallback Mode
  if (use2DFallback) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative aspect-[4/3] max-w-[340px] mx-auto rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center">
          <MedicineBoxSvg product={product} face={selected2DFace} />
        </div>

        {/* 2D Face Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-cairo">
          {[
            { id: 'front' as BoxFace, labelAr: 'الواجهة', labelEn: 'Front' },
            { id: 'back' as BoxFace, labelAr: 'الخلفية والباركود', labelEn: 'Back & Barcode' },
            { id: 'side-right' as BoxFace, labelAr: 'الجرعة', labelEn: 'Dosage' },
            { id: 'side-left' as BoxFace, labelAr: 'التحذيرات', labelEn: 'Warnings' },
            { id: 'top' as BoxFace, labelAr: 'الختم', labelEn: 'Seal' },
            { id: 'bottom' as BoxFace, labelAr: 'السعر والصلاحية', labelEn: 'Price & Expiry' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelected2DFace(tab.id)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                selected2DFace === tab.id
                  ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500'
              }`}
            >
              {locale === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUse2DFallback(false)}
            className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 font-bold flex items-center gap-1"
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'عرض 3D' : 'Enable 3D'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Pure 3D CSS Cube Implementation
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Interactive 3D Perspective Stage */}
      <div
        className="relative w-full max-w-[340px] h-[280px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        style={{ perspective: '1100px' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="3D Rotatable Medicine Box. Drag to inspect all angles."
      >
        {/* Subtle ground shadow disk */}
        <div
          className="absolute bottom-4 w-48 h-12 rounded-full bg-slate-900/10 dark:bg-black/40 blur-xl pointer-events-none transition-transform duration-200"
          style={{
            transform: `scale(${1 - Math.abs(rotX) / 180}) rotate(${rotY * 0.2}deg)`,
          }}
        />

        {/* 3D Cube Assembly Box (W: 260px, H: 180px, D: 90px) */}
        <div
          className="relative transition-transform"
          style={{
            width: '260px',
            height: '180px',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* 1. FRONT FACE (W: 260px, H: 180px, Z: +45px) */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-sm"
            style={{
              transform: 'translateZ(45px)',
              backfaceVisibility: 'hidden',
            }}
          >
            <MedicineBoxSvg product={product} face="front" />
          </div>

          {/* 2. BACK FACE (W: 260px, H: 180px, rotated 180deg, Z: +45px) */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-sm"
            style={{
              transform: 'rotateY(180deg) translateZ(45px)',
              backfaceVisibility: 'hidden',
            }}
          >
            <MedicineBoxSvg product={product} face="back" />
          </div>

          {/* 3. RIGHT SIDE FACE (W: 90px, H: 180px, rotated 90deg, Z: +130px) */}
          <div
            className="absolute top-0 rounded-xl overflow-hidden shadow-sm"
            style={{
              width: '90px',
              height: '180px',
              left: '85px', // Centered horizontally: (260 - 90)/2 = 85px
              transform: 'rotateY(90deg) translateZ(130px)',
              backfaceVisibility: 'hidden',
            }}
          >
            <MedicineBoxSvg product={product} face="side-right" />
          </div>

          {/* 4. LEFT SIDE FACE (W: 90px, H: 180px, rotated -90deg, Z: +130px) */}
          <div
            className="absolute top-0 rounded-xl overflow-hidden shadow-sm"
            style={{
              width: '90px',
              height: '180px',
              left: '85px',
              transform: 'rotateY(-90deg) translateZ(130px)',
              backfaceVisibility: 'hidden',
            }}
          >
            <MedicineBoxSvg product={product} face="side-left" />
          </div>

          {/* 5. TOP FLAP FACE (W: 260px, H: 90px, rotated 90deg, Z: +90px) */}
          <div
            className="absolute left-0 rounded-xl overflow-hidden shadow-sm"
            style={{
              width: '260px',
              height: '90px',
              top: '45px', // Centered vertically: (180 - 90)/2 = 45px
              transform: 'rotateX(90deg) translateZ(90px)',
              backfaceVisibility: 'hidden',
            }}
          >
            <MedicineBoxSvg product={product} face="top" />
          </div>

          {/* 6. BOTTOM BASE FACE (W: 260px, H: 90px, rotated -90deg, Z: +90px) */}
          <div
            className="absolute left-0 rounded-xl overflow-hidden shadow-sm"
            style={{
              width: '260px',
              height: '90px',
              top: '45px',
              transform: 'rotateX(-90deg) translateZ(90px)',
              backfaceVisibility: 'hidden',
            }}
          >
            <MedicineBoxSvg product={product} face="bottom" />
          </div>
        </div>
      </div>

      {/* Floating Drag Hint Pill */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-3 border border-slate-200 dark:border-slate-700 shadow-sm font-cairo">
        <Rotate3d className="w-3.5 h-3.5 text-teal-600 animate-spin-slow" />
        <span>
          {isDragging
            ? locale === 'ar' ? 'حرّك بالسحب لمعاينة كافة الجوانب' : 'Dragging to rotate...'
            : locale === 'ar' ? 'اسحب العلبة بالماوس أو اللمس للفحص 360°' : 'Drag box to inspect in 360°'}
        </span>
      </div>

      {/* Quick Preset Buttons & Controls */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-cairo">
        <button
          type="button"
          onClick={() => setPreset('الواجهة', 0, 0)}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
        >
          {locale === 'ar' ? 'الواجهة' : 'Front'}
        </button>
        <button
          type="button"
          onClick={() => setPreset('الخلفية والباركود', 0, 180)}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
        >
          {locale === 'ar' ? 'الباركود والخلفية' : 'Back & Barcode'}
        </button>
        <button
          type="button"
          onClick={() => setPreset('الجرعة والاستخدام', 0, 90)}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
        >
          {locale === 'ar' ? 'الجرعة' : 'Dosage'}
        </button>
        <button
          type="button"
          onClick={() => setPreset('السعر وتاريخ الصلاحية', -90, 0)}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
        >
          {locale === 'ar' ? 'السعر والصلاحية' : 'Price & Expiry'}
        </button>
        <button
          type="button"
          onClick={() => setPreset('منظور ثلاثي الأبعاد', -12, 25)}
          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 text-xs font-bold transition flex items-center gap-1 active:scale-95"
          title="إعادة ضبط الزاوية"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{locale === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
        </button>
        <button
          type="button"
          onClick={() => setUse2DFallback(true)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-medium transition"
        >
          {locale === 'ar' ? 'عرض 2D مبسط' : '2D View'}
        </button>
      </div>
    </div>
  );
}
