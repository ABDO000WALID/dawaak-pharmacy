'use client';

import React from 'react';
import { DosageForm } from '@/types/product';

export type SvgBoxVariant = 'card' | 'pdp' | 'thumb' | 'face';
export type BoxFace = 'front' | 'back' | 'top' | 'bottom' | 'side-right' | 'side-left';

export interface MedicineBoxProductProps {
  id: string;
  sku?: string;
  nameAr: string;
  nameEn: string;
  dosageForm: DosageForm;
  dosageFormAr?: string;
  concentration?: string;
  activeIngredientAr?: string;
  activeIngredientEn?: string;
  packSizeAr?: string;
  packSize?: string;
  manufacturerAr?: string;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  categoryId?: string;
  priceEgp?: number;
  salePriceEgp?: number;
}

export interface MedicineBoxSvgProps {
  product: MedicineBoxProductProps;
  variant?: SvgBoxVariant;
  face?: BoxFace;
  className?: string;
}

// Category accent color mapping
function getCategoryColors(categoryId?: string) {
  switch (categoryId) {
    case 'analgesics-pain':
      return { primary: '#0F766E', secondary: '#00A86B', light: '#CCFBF1', text: '#115E59' };
    case 'respiratory-cough':
      return { primary: '#0284C7', secondary: '#06B6D4', light: '#E0F2FE', text: '#0369A1' };
    case 'digestive-health':
      return { primary: '#D97706', secondary: '#B45309', light: '#FEF3C7', text: '#92400E' };
    case 'chronic-care':
    case 'chronic-cardio':
      return { primary: '#991B1B', secondary: '#E11D48', light: '#FFE4E6', text: '#881337' };
    case 'vitamins-supplements':
      return { primary: '#EA580C', secondary: '#F59E0B', light: '#FFEDD5', text: '#9A3412' };
    case 'pediatric-health':
      return { primary: '#0D9488', secondary: '#F43F5E', light: '#F0FDFA', text: '#134E4A' };
    case 'skin-dermatology':
      return { primary: '#6366F1', secondary: '#8B5CF6', light: '#EEF2FF', text: '#4338CA' };
    case 'first-aid-supplies':
      return { primary: '#DC2626', secondary: '#475569', light: '#FEE2E2', text: '#991B1B' };
    default:
      return { primary: '#0F766E', secondary: '#10B981', light: '#F0FDF4', text: '#047857' };
  }
}

export function MedicineBoxSvg({
  product,
  variant = 'card',
  face = 'front',
  className = '',
}: MedicineBoxSvgProps) {
  const colors = getCategoryColors(product.categoryId);
  const dosage = (product.dosageForm || 'Tablets') as string;

  // 1. Back Face Graphic (for 3D box or detailed view)
  if (face === 'back') {
    return (
      <svg
        viewBox="0 0 320 220"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full select-none ${className}`}
        aria-label={`${product.nameEn} Package Back Details`}
      >
        <rect width="320" height="220" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="0" y="0" width="320" height="18" rx="8" fill={colors.primary} />
        {/* Active Ingredients & Formula */}
        <text x="20" y="44" fontFamily="Cairo, system-ui, sans-serif" fontSize="13" fontWeight="bold" fill="#1E293B">
          Composition & Active Formula:
        </text>
        <text x="20" y="64" fontFamily="system-ui, sans-serif" fontSize="10" fill="#475569">
          {product.activeIngredientEn || 'Synthetic Active Formulation'}
        </text>
        <text x="20" y="80" fontFamily="system-ui, sans-serif" fontSize="10" fill="#64748B">
          Excipients q.s. to 1 dose unit.
        </text>
        {/* Synthetic MOH Registration Badge */}
        <rect x="20" y="96" width="280" height="28" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
        <text x="30" y="114" fontFamily="system-ui, monospace" fontSize="9" fill="#334155" fontWeight="bold">
          EGY-EDA-SYN: {product.sku || 'EGY-SYN-001'} | REG: 2026/SYN/104
        </text>
        {/* Barcode Graphic */}
        <g transform="translate(20, 138)">
          <rect width="180" height="42" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" rx="4" />
          {/* Barcode vertical stripes */}
          <line x1="12" y1="6" x2="12" y2="34" stroke="#0F172A" strokeWidth="2" />
          <line x1="18" y1="6" x2="18" y2="34" stroke="#0F172A" strokeWidth="1" />
          <line x1="23" y1="6" x2="23" y2="34" stroke="#0F172A" strokeWidth="3" />
          <line x1="30" y1="6" x2="30" y2="34" stroke="#0F172A" strokeWidth="1" />
          <line x1="36" y1="6" x2="36" y2="34" stroke="#0F172A" strokeWidth="2" />
          <line x1="42" y1="6" x2="42" y2="34" stroke="#0F172A" strokeWidth="4" />
          <line x1="50" y1="6" x2="50" y2="34" stroke="#0F172A" strokeWidth="1" />
          <line x1="55" y1="6" x2="55" y2="34" stroke="#0F172A" strokeWidth="2" />
          <line x1="62" y1="6" x2="62" y2="34" stroke="#0F172A" strokeWidth="3" />
          <line x1="70" y1="6" x2="70" y2="34" stroke="#0F172A" strokeWidth="1" />
          <line x1="76" y1="6" x2="76" y2="34" stroke="#0F172A" strokeWidth="2" />
          <line x1="84" y1="6" x2="84" y2="34" stroke="#0F172A" strokeWidth="4" />
          <line x1="94" y1="6" x2="94" y2="34" stroke="#0F172A" strokeWidth="2" />
          <line x1="102" y1="6" x2="102" y2="34" stroke="#0F172A" strokeWidth="1" />
          <line x1="108" y1="6" x2="108" y2="34" stroke="#0F172A" strokeWidth="3" />
          <line x1="116" y1="6" x2="116" y2="34" stroke="#0F172A" strokeWidth="2" />
          <line x1="124" y1="6" x2="124" y2="34" stroke="#0F172A" strokeWidth="1" />
          <line x1="132" y1="6" x2="132" y2="34" stroke="#0F172A" strokeWidth="4" />
          <line x1="142" y1="6" x2="142" y2="34" stroke="#0F172A" strokeWidth="2" />
          <line x1="150" y1="6" x2="150" y2="34" stroke="#0F172A" strokeWidth="1" />
          <line x1="158" y1="6" x2="158" y2="34" stroke="#0F172A" strokeWidth="3" />
          <line x1="168" y1="6" x2="168" y2="34" stroke="#0F172A" strokeWidth="2" />
          <text x="90" y="39" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#475569">
            {product.sku || '6221000987654'}
          </text>
        </g>
        {/* Manufacturer */}
        <text x="215" y="152" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="bold" fill="#334155">
          {product.manufacturer || 'PharmaNile Egypt Labs'}
        </text>
        <text x="215" y="166" fontFamily="Cairo, system-ui, sans-serif" fontSize="9" fill="#64748B">
          صنع في جمهورية مصر العربية
        </text>
        {/* Synthetic Disclaimer footer */}
        <rect x="0" y="196" width="320" height="24" fill="#0F172A" />
        <text x="160" y="212" textAnchor="middle" fontFamily="Cairo, system-ui, sans-serif" fontSize="9" fill="#94A3B8">
          مستحضر تركيبي تجريبي لأغراض البرمجة والمحاكاة فقط
        </text>
      </svg>
    );
  }

  // 2. Right Side Face (Usage & Dosage)
  if (face === 'side-right') {
    return (
      <svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full ${className}`}>
        <rect width="120" height="220" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect width="120" height="12" fill={colors.primary} />
        <text x="60" y="32" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="10" fontWeight="bold" fill="#0F172A">
          الجرعة والاستخدام
        </text>
        <text x="10" y="55" fontFamily="Cairo, sans-serif" fontSize="8" fill="#475569">
          • حسب إرشادات الطبيب
        </text>
        <text x="10" y="75" fontFamily="Cairo, sans-serif" fontSize="8" fill="#475569">
          • لا تتجاوز الجرعة المقررة
        </text>
        <text x="10" y="95" fontFamily="Cairo, sans-serif" fontSize="8" fill="#475569">
          • يحفظ أقل من 25 مئوية
        </text>
        <rect x="10" y="115" width="100" height="35" rx="4" fill={colors.light} />
        <text x="60" y="132" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="8" fontWeight="bold" fill={colors.text}>
          {product.dosageFormAr || 'أقراص علاجية'}
        </text>
        <text x="60" y="144" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7" fill={colors.text}>
          {product.packSizeAr || 'عبوة قياسية'}
        </text>
        <rect x="0" y="200" width="120" height="20" fill="#334155" />
        <text x="60" y="213" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="7" fill="#F8FAFC">
          دواك مصر 2026
        </text>
      </svg>
    );
  }

  // 3. Left Side Face (Warnings)
  if (face === 'side-left') {
    return (
      <svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full ${className}`}>
        <rect width="120" height="220" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect width="120" height="12" fill={colors.secondary} />
        <text x="60" y="32" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="10" fontWeight="bold" fill="#B91C1C">
          تحذيرات هامة
        </text>
        <text x="10" y="55" fontFamily="Cairo, sans-serif" fontSize="8" fill="#475569">
          • يحفظ بعيداً عن الأطفال
        </text>
        <text x="10" y="75" fontFamily="Cairo, sans-serif" fontSize="8" fill="#475569">
          • اقرأ النشرة الداخلية بعناية
        </text>
        <text x="10" y="95" fontFamily="Cairo, sans-serif" fontSize="8" fill="#475569">
          • لا يستخدم بعد انتهاء الصلاحية
        </text>
        {product.prescriptionRequired && (
          <g transform="translate(10, 115)">
            <rect width="100" height="30" rx="4" fill="#FEE2E2" stroke="#F87171" strokeWidth="1" />
            <text x="50" y="18" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="8" fontWeight="bold" fill="#991B1B">
              يصرف بروشتة طبية فقط
            </text>
            <text x="50" y="26" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="6" fill="#991B1B">
              Rx ONLY
            </text>
          </g>
        )}
        <rect x="0" y="200" width="120" height="20" fill="#0F172A" />
        <text x="60" y="213" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="7" fill="#94A3B8">
          صيدلية دواك
        </text>
      </svg>
    );
  }

  // 4. Top Face (Tamper Seal & Opening Tuck)
  if (face === 'top') {
    return (
      <svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full ${className}`}>
        <rect width="320" height="120" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
        {/* Holographic Tamper-Evident Seal */}
        <g transform="translate(125, 35)">
          <rect width="70" height="50" rx="6" fill="url(#hologramGrad)" stroke="#38BDF8" strokeWidth="1" />
          <text x="35" y="25" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="8" fontWeight="bold" fill="#0369A1">
            ختم الأمان
          </text>
          <text x="35" y="38" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7" fill="#0284C7">
            DAWAAK SEAL
          </text>
        </g>
        {/* Braille Simulation dots */}
        <g fill="#94A3B8" opacity="0.6">
          <circle cx="30" cy="50" r="2.5" />
          <circle cx="30" cy="65" r="2.5" />
          <circle cx="45" cy="50" r="2.5" />
          <circle cx="45" cy="65" r="2.5" />
          <circle cx="60" cy="50" r="2.5" />
          <circle cx="75" cy="65" r="2.5" />
        </g>
        <defs>
          <linearGradient id="hologramGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="50%" stopColor="#DDD6FE" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 5. Bottom Face (Price, Batch & Expiry)
  if (face === 'bottom') {
    const priceDisplay = (product.salePriceEgp || product.priceEgp || 35.0).toFixed(2);
    return (
      <svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full ${className}`}>
        <rect width="320" height="120" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="20" y="20" width="280" height="80" rx="8" fill="#0F172A" />
        <text x="35" y="46" fontFamily="monospace" fontSize="11" fill="#38BDF8" fontWeight="bold">
          B.NO: EGY26-9481
        </text>
        <text x="35" y="66" fontFamily="monospace" fontSize="11" fill="#4ADE80" fontWeight="bold">
          EXP: 12/2028 (صلاحية 3 سنوات)
        </text>
        <text x="35" y="86" fontFamily="monospace" fontSize="12" fill="#FBBF24" fontWeight="bold">
          P.P: {priceDisplay} EGP (السعر الرسمي)
        </text>
      </svg>
    );
  }

  // 6. Primary Front Face (Standard & Default)
  // Tailored geometry according to product.dosageForm:
  return (
    <svg
      viewBox="0 0 320 220"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
      aria-label={`${product.nameAr} - ${product.nameEn}`}
    >
      <defs>
        {/* Soft Drop Shadow Filter */}
        <filter id={`boxShadow-${product.id}`} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
        {/* Category Gradient */}
        <linearGradient id={`catGrad-${product.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
        {/* Amber Glass Gradient for Syrups */}
        <linearGradient id={`amberGlass-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="40%" stopColor="#B45309" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Main Box Outer Container */}
      <rect
        x="6"
        y="6"
        width="308"
        height="208"
        rx="14"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        filter={`url(#boxShadow-${product.id})`}
      />

      {/* Top Category Accent Header Band */}
      <path
        d="M 6 20 C 6 12 12 6 20 6 L 300 6 C 308 6 314 12 314 20 L 314 44 L 6 44 Z"
        fill={`url(#catGrad-${product.id})`}
      />

      {/* Brand Watermark & Synthetic Badge on Top Header */}
      <text
        x="20"
        y="26"
        fontFamily="Cairo, system-ui, sans-serif"
        fontSize="11"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        دواك • Dawaak
      </text>
      <g transform="translate(240, 14)">
        <rect width="64" height="18" rx="9" fill="#FFFFFF" fillOpacity="0.25" />
        <text
          x="32"
          y="12"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontSize="8"
          fontWeight="bold"
          fill="#FFFFFF"
        >
          {product.prescriptionRequired ? 'Rx ONLY' : 'OTC'}
        </text>
      </g>

      {/* ----------------- SPECIFIC DOSAGE FORM GRAPHIC ----------------- */}
      {dosage === 'Syrup' ? (
        /* SYRUP PROFILE: Amber Bottle + Liquid Level + Graduation marks */
        <g transform="translate(232, 60)">
          {/* Measuring cap */}
          <rect x="18" y="0" width="24" height="14" rx="3" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="22" y="14" width="16" height="10" fill="#94A3B8" />
          {/* Bottle Body */}
          <path
            d="M 12 28 C 12 24 18 24 22 24 L 38 24 C 42 24 48 24 48 28 L 56 46 C 58 50 60 56 60 62 L 60 120 C 60 126 56 130 50 130 L 10 130 C 4 130 0 126 0 120 L 0 62 C 0 56 2 50 4 46 Z"
            fill={`url(#amberGlass-${product.id})`}
            stroke="#451A03"
            strokeWidth="1.5"
          />
          {/* Amber reflection highlight */}
          <path d="M 6 56 L 6 122" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          {/* Bottle label */}
          <rect x="8" y="68" width="44" height="42" rx="3" fill="#FFFFFF" opacity="0.9" />
          <text x="30" y="86" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="7" fontWeight="bold" fill="#78350F">
            شراب مركز
          </text>
          <text x="30" y="98" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="6" fill="#B45309">
            120 ml
          </text>
        </g>
      ) : dosage === 'Topical Gel' || dosage === 'Cream' ? (
        /* TOPICAL CREAM / GEL PROFILE: Aluminum Squeeze Tube + Dermal Wave */
        <g transform="translate(225, 68)">
          {/* Tube Cap / Nozzle */}
          <rect x="24" y="0" width="14" height="16" rx="2" fill={colors.primary} />
          <polygon points="18,16 44,16 52,36 10,36" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          {/* Tube Body */}
          <path
            d="M 10 36 L 52 36 L 58 116 L 4 116 Z"
            fill="url(#creamBodyGrad)"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          {/* Crimped end at bottom */}
          <rect x="2" y="116" width="58" height="8" fill="#64748B" rx="1" />
          <line x1="8" y1="118" x2="8" y2="122" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="16" y1="118" x2="16" y2="122" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="24" y1="118" x2="24" y2="122" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="32" y1="118" x2="32" y2="122" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="40" y1="118" x2="40" y2="122" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="48" y1="118" x2="48" y2="122" stroke="#E2E8F0" strokeWidth="1" />
          {/* Tube Ribbon */}
          <path
            d="M 8 70 Q 31 82 54 70"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="creamBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
        </g>
      ) : dosage === 'Eye Drops' || dosage === 'Drops' ? (
        /* EYE DROPS PROFILE: Dropper Bottle + Precision Tip + Suspended Droplet */
        <g transform="translate(235, 65)">
          {/* Rubber bulb */}
          <path d="M 14 0 C 14 0 24 -6 34 0 L 34 16 L 14 16 Z" fill="#475569" />
          {/* Dropper Cap collar */}
          <rect x="10" y="16" width="28" height="12" rx="2" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          {/* Bottle container */}
          <rect x="6" y="28" width="36" height="74" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Liquid level */}
          <rect x="8" y="55" width="32" height="45" rx="6" fill={colors.light} />
          {/* Precision dropper tip */}
          <polygon points="21,102 27,102 24,116" fill="#38BDF8" opacity="0.8" />
          {/* Suspended Droplet */}
          <circle cx="24" cy="126" r="3.5" fill="#0284C7" />
        </g>
      ) : dosage === 'Effervescent' ? (
        /* EFFERVESCENT PROFILE: Cylinder Tube + Carbonation bubbles */
        <g transform="translate(235, 60)">
          <rect x="8" y="0" width="36" height="16" rx="4" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="10" y="16" width="32" height="116" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Effervescent bubbles */}
          <circle cx="26" cy="100" r="4" fill={colors.secondary} opacity="0.6" />
          <circle cx="20" cy="80" r="3" fill={colors.primary} opacity="0.5" />
          <circle cx="32" cy="65" r="5" fill={colors.secondary} opacity="0.7" />
          <circle cx="22" cy="45" r="3.5" fill={colors.primary} opacity="0.8" />
          <circle cx="28" cy="30" r="2.5" fill={colors.secondary} opacity="0.9" />
        </g>
      ) : (
        /* TABLETS / CAPSULES PROFILE: Blister foil sheet with shiny pill pockets */
        <g transform="translate(216, 56)">
          <rect x="0" y="0" width="86" height="136" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* 4 rows x 2 columns of blister pockets */}
          {[0, 1, 2, 3].map((row) => (
            <React.Fragment key={row}>
              {/* Col 1 */}
              <rect
                x="10"
                y={14 + row * 28}
                width="28"
                height="18"
                rx="9"
                fill="url(#blisterPillGrad)"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              <circle cx="16" cy={23 + row * 28} r="2.5" fill="#FFFFFF" opacity="0.7" />
              {/* Col 2 */}
              <rect
                x="48"
                y={14 + row * 28}
                width="28"
                height="18"
                rx="9"
                fill="url(#blisterPillGrad)"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              <circle cx="54" cy={23 + row * 28} r="2.5" fill="#FFFFFF" opacity="0.7" />
            </React.Fragment>
          ))}
          <defs>
            <linearGradient id="blisterPillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
        </g>
      )}

      {/* ----------------- PRODUCT TEXT & TYPOGRAPHY ----------------- */}
      {/* Arabic Commercial Name */}
      <text
        x="20"
        y="76"
        fontFamily="Cairo, system-ui, sans-serif"
        fontSize="17"
        fontWeight="900"
        fill="#0F172A"
      >
        {product.nameAr}
      </text>

      {/* English Latin Name */}
      <text
        x="20"
        y="96"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill="#475569"
      >
        {product.nameEn}
      </text>

      {/* Active Ingredient Formula Bar */}
      <g transform="translate(20, 110)">
        <rect width="180" height="24" rx="6" fill={colors.light} stroke={colors.secondary} strokeWidth="0.8" />
        <text
          x="10"
          y="16"
          fontFamily="Cairo, system-ui, sans-serif"
          fontSize="9.5"
          fontWeight="bold"
          fill={colors.text}
        >
          {product.activeIngredientAr ? product.activeIngredientAr.slice(0, 36) : 'مادة فعالة مطابقة'}
        </text>
      </g>

      {/* Concentration & Pack Size Badges */}
      <g transform="translate(20, 144)">
        {product.concentration && (
          <g>
            <rect width="68" height="20" rx="4" fill="#F1F5F9" />
            <text x="34" y="14" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="bold" fill="#334155">
              {product.concentration}
            </text>
          </g>
        )}
        <g transform="translate(74, 0)">
          <rect width="90" height="20" rx="4" fill="#F1F5F9" />
          <text x="45" y="14" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="9" fill="#475569">
            {product.packSizeAr || product.dosageFormAr || 'عبوة طبية'}
          </text>
        </g>
      </g>

      {/* Manufacturer Footer */}
      <text
        x="20"
        y="188"
        fontFamily="Cairo, system-ui, sans-serif"
        fontSize="9"
        fill="#64748B"
      >
        {product.manufacturerAr || 'معامل فارما نايل مصر'}
      </text>

      {/* Official Hologram Stamp Graphic */}
      <g transform="translate(160, 172)">
        <circle cx="16" cy="16" r="14" fill="#F8FAFC" stroke={colors.primary} strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="16" y="15" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="6" fontWeight="bold" fill={colors.primary}>
          صنع في
        </text>
        <text x="16" y="23" textAnchor="middle" fontFamily="Cairo, sans-serif" fontSize="6" fontWeight="bold" fill={colors.primary}>
          مصر
        </text>
      </g>
    </svg>
  );
}
