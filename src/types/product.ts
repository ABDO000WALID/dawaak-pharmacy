export type DosageForm =
  | 'Tablets'
  | 'Syrup'
  | 'Capsules'
  | 'Topical Gel'
  | 'Effervescent'
  | 'Eye Drops'
  | 'Nasal Spray'
  | 'Sachets'
  | 'Spray';

export type CategoryId =
  | 'analgesics-pain'
  | 'respiratory-cough'
  | 'digestive-health'
  | 'chronic-care'
  | 'vitamins-supplements'
  | 'pediatric-health'
  | 'skin-dermatology'
  | 'first-aid-supplies';

export interface Category {
  id: CategoryId;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  displayOrder: number;
}

export type TimingBucket = 'morning' | 'noon' | 'night';

export interface SyntheticProduct {
  id: string;
  sku: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  categoryId: CategoryId;
  activeIngredientAr: string;
  activeIngredientEn: string;
  concentration: string;
  dosageForm: DosageForm;
  dosageFormAr: string;
  packSize: string;
  packSizeAr: string;
  manufacturer: string;
  manufacturerAr: string;
  priceEgp: number;
  salePriceEgp?: number;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number; // Anti-hoarding limit: 5
  prescriptionRequired: boolean;
  storageConditions: string;
  storageConditionsAr: string;
  images: string[];
  descriptionAr: string;
  descriptionEn: string;
  dosageInstructionsAr: string;
  dosageInstructionsEn: string;
  warningsAr: string[];
  warningsEn: string[];
  isSynthetic: true;
  syntheticDisclaimerAr: string;
  syntheticDisclaimerEn: string;
  rating: number;
  reviewsCount: number;
  substituteId?: string; // Points to equivalent Egyptian generic
  substituteSavingsEgp?: number;
  timingBucket?: TimingBucket; // Recommended daily time slot for dosage schedule
}
