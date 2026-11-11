import { PRODUCTS } from '@/lib/mock-data/products';
import { CATEGORIES } from '@/lib/mock-data/categories';
import { SyntheticProduct, Category } from '@/types/product';
import { normalizeArabic } from '@/lib/utils/arabic';
import {
  getCatalogRepository,
  CatalogRepository,
  ProductFilterOptions,
  PaginatedProductsResult,
  wordTrigramSimilarity,
} from '@/lib/repositories';

// Egyptian dialect colloquial symptom dictionary mapping
const DIALECT_MAP: Record<string, string[]> = {
  'صداع': ['syntraphol-extra-500', 'syntraphol-nile-generic-500', 'vitamol-plus-fast', 'citra-cold-sinus'],
  'سخونية': ['syntraphol-extra-500', 'pediatric-cough-k-oral', 'syntraphol-nile-generic-500', 'kids-relief-fever-syrup'],
  'حرارة': ['syntraphol-extra-500', 'pediatric-cough-k-oral', 'kids-relief-fever-syrup'],
  'مغص': ['egyptocalm-effervescent', 'gastroshield-m-20', 'ombrasynth-local-20', 'ombrasynth-colon-care', 'pediasynth-colic-drops'],
  'حموضة': ['gastroshield-m-20', 'egyptocalm-effervescent', 'ombrasynth-local-20', 'ombrasynth-colon-care'],
  'فوار': ['egyptocalm-effervescent', 'pulmo-relief-sachets'],
  'كحة': ['pharmacure-dx-syrup', 'pediatric-cough-k-oral', 'bronchosynth-expectorant-syrup', 'pulmo-relief-sachets'],
  'سعال': ['pharmacure-dx-syrup', 'pediatric-cough-k-oral', 'bronchosynth-expectorant-syrup'],
  'بلغم': ['pharmacure-dx-syrup', 'bronchosynth-expectorant-syrup', 'pulmo-relief-sachets'],
  'أعصاب': ['neurorelief-z-50'],
  'فيتامين': ['vitaboost-max-daily', 'calci-synth-d3', 'zincosynth-c', 'ferro-synth-iron'],
  'فيتامينات': ['vitaboost-max-daily', 'sleepeasy-synth-night', 'calci-synth-d3', 'zincosynth-c'],
  'ضغط': ['cardiocare-x-10', 'cardiosynth-egypt-10', 'hypersynth-plus-combo'],
  'سكر': ['glucofix-syn-500', 'glucofix-nile-domestic-500'],
  'مفاصل': ['osteojoint-synth-extra', 'relaxogen-forte-relaxant'],
  'عضلات': ['relaxogen-forte-relaxant'],
  'ركبة': ['osteojoint-synth-extra'],
  'خشونة': ['osteojoint-synth-extra'],
  'جروح': ['septoderm-antiseptic-spray', 'dermoheal-plus-gel'],
  'حروق': ['dermoheal-plus-gel'],
  'مطهر': ['septoderm-antiseptic-spray'],
  'عين': ['ocuclear-s-eye-drops'],
  'عيني': ['ocuclear-s-eye-drops'],
  'جفاف': ['ocuclear-s-eye-drops', 'dermoheal-plus-gel'],
  'نوم': ['sleepeasy-synth-night'],
  'أرق': ['sleepeasy-synth-night'],
  'أطفال': ['pediatric-cough-k-oral', 'kids-relief-fever-syrup', 'teething-care-gel', 'pediasynth-colic-drops', 'baby-rehydra-sachets'],
  'بشرة': ['dermoheal-plus-gel'],
  'حب شباب': ['dermoheal-plus-gel'],
  'تسنين': ['teething-care-gel'],
  'حرارة أطفال': ['pediatric-cough-k-oral', 'kids-relief-fever-syrup'],
};

export { DIALECT_MAP };

export class ProductService {
  /**
   * Returns the active CatalogRepository resolved via the environment factory.
   */
  static getRepository(): CatalogRepository {
    return getCatalogRepository();
  }

  /**
   * Asynchronous catalog retrieval utilizing the active repository.
   */
  static async getProductsAsync(options?: ProductFilterOptions): Promise<PaginatedProductsResult> {
    return getCatalogRepository().getProducts(options);
  }

  /**
   * Asynchronous typo-tolerant search utilizing the active repository.
   */
  static async searchProductsAsync(
    query: string,
    options?: Omit<ProductFilterOptions, 'search'>
  ): Promise<PaginatedProductsResult> {
    return getCatalogRepository().searchProducts(query, options);
  }

  /**
   * Asynchronous single product lookup by ID.
   */
  static async getProductByIdAsync(id: string): Promise<SyntheticProduct | null> {
    return getCatalogRepository().getProductById(id);
  }

  /**
   * Asynchronous single product lookup by slug.
   */
  static async getProductBySlugAsync(slug: string): Promise<SyntheticProduct | null> {
    return getCatalogRepository().getProductBySlug(slug);
  }

  /**
   * Backward-compatible synchronous product filtering for existing callers and tests.
   */
  static getAllProducts(options?: {
    category?: string;
    search?: string;
    prescription?: boolean;
    sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc';
    limit?: number;
  }): SyntheticProduct[] {
    let result = [...PRODUCTS];

    // Filter out internal generic substitute standalone duplicates from primary general view unless explicitly searched
    if (!options?.search && !options?.category) {
      result = result.filter(p => !p.id.endsWith('-alt'));
    }

    if (options?.category) {
      result = result.filter(p => p.categoryId === options.category);
    }

    if (options?.prescription !== undefined) {
      result = result.filter(p => p.prescriptionRequired === options.prescription);
    }

    if (options?.search) {
      const rawQ = options.search.trim().toLowerCase();
      const normQ = normalizeArabic(options.search);

      // Check Egyptian dialect symptoms with normalization
      const dialectMatchSlugs: string[] = [];
      for (const [symptom, slugs] of Object.entries(DIALECT_MAP)) {
        const normSymptom = normalizeArabic(symptom);
        if (
          (normQ && (normQ.includes(normSymptom) || (normQ.length >= 2 && normSymptom.includes(normQ)))) ||
          (rawQ && (rawQ.includes(symptom.toLowerCase()) || (rawQ.length >= 2 && symptom.toLowerCase().includes(rawQ))))
        ) {
          dialectMatchSlugs.push(...slugs);
        }
      }

      const scored = result.map(p => {
        let score = 0;
        const isDialectMatch = dialectMatchSlugs.includes(p.slug);
        if (isDialectMatch) score += 0.85;

        const normNameAr = normalizeArabic(p.nameAr);
        const normActiveAr = normalizeArabic(p.activeIngredientAr);
        const normDescAr = normalizeArabic(p.descriptionAr);
        const nameEn = p.nameEn.toLowerCase();
        const activeEn = p.activeIngredientEn.toLowerCase();
        const descEn = p.descriptionEn.toLowerCase();

        const arTokens = normQ.split(/\s+/).filter(t => t.length >= 3);
        const enTokens = rawQ.split(/\s+/).filter(t => t.length >= 3);

        const matchesArabic = normQ.length > 0 && (
          normNameAr.includes(normQ) ||
          normActiveAr.includes(normQ) ||
          normDescAr.includes(normQ) ||
          (arTokens.length > 1 && arTokens.some(t => normNameAr.includes(t) || normActiveAr.includes(t)))
        );

        const matchesEnglish = rawQ.length > 0 && (
          nameEn.includes(rawQ) ||
          activeEn.includes(rawQ) ||
          descEn.includes(rawQ) ||
          (enTokens.length > 1 && enTokens.some(t => nameEn.includes(t) || activeEn.includes(t)))
        );

        if (matchesArabic) score += 0.9;
        if (matchesEnglish) score += 0.9;

        // Trigram fuzzy similarity (tolerance for typos matching pg_trgm word_similarity)
        const simNameAr = wordTrigramSimilarity(normQ, normNameAr);
        const simActiveAr = wordTrigramSimilarity(normQ, normActiveAr);
        const simNameEn = wordTrigramSimilarity(rawQ, nameEn);
        const simActiveEn = wordTrigramSimilarity(rawQ, activeEn);

        const bestSim = Math.max(simNameAr, simActiveAr, simNameEn, simActiveEn);
        if (bestSim >= 0.25) {
          score += bestSim * 0.75;
        }

        return { product: p, score, matched: isDialectMatch || matchesArabic || matchesEnglish || bestSim >= 0.25 };
      });

      result = scored
        .filter(item => item.matched && item.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);
    }

    if (options?.sort) {
      switch (options.sort) {
        case 'price_asc':
          result.sort((a, b) => (a.salePriceEgp ?? a.priceEgp) - (b.salePriceEgp ?? b.priceEgp));
          break;
        case 'price_desc':
          result.sort((a, b) => (b.salePriceEgp ?? b.priceEgp) - (a.salePriceEgp ?? a.priceEgp));
          break;
        case 'rating_desc':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'name_asc':
          result.sort((a, b) => a.nameAr.localeCompare(b.nameAr));
          break;
      }
    }

    if (options?.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  static getProductById(id: string): SyntheticProduct | undefined {
    return PRODUCTS.find(p => p.id === id);
  }

  static getProductBySlug(slug: string): SyntheticProduct | undefined {
    return PRODUCTS.find(p => p.slug === slug);
  }

  static getFeaturedProducts(limit: number = 8): SyntheticProduct[] {
    return PRODUCTS.filter(p => !p.id.endsWith('-alt')).slice(0, limit);
  }

  static getCategories(): Category[] {
    return CATEGORIES;
  }

  static getCategoryById(id: string): Category | undefined {
    return CATEGORIES.find(c => c.id === id);
  }

  static getSubstitute(productId: string): SyntheticProduct | undefined {
    const product = this.getProductById(productId);
    if (!product || !product.substituteId) return undefined;
    return this.getProductById(product.substituteId);
  }
}
