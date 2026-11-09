import { Locale } from '@/types/common';

/**
 * Formats monetary amounts in Egyptian Pounds (EGP / ج.م).
 * Follows Egyptian e-commerce standard (clear decimal notation with localized currency symbol).
 */
export function formatEGP(amount: number, locale: Locale = 'ar'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const fixed = safeAmount.toFixed(2);

  if (locale === 'ar') {
    return `${fixed} ج.م`;
  }
  return `${fixed} EGP`;
}
