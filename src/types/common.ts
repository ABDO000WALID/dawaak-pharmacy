export type Locale = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';
export type Theme = 'light' | 'dark';

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  deliveryFeeEgp: number;
  deliveryDaysEstimated: number;
}
