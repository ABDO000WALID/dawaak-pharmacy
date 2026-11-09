import { CatalogRepository, ProductFilterOptions, PaginatedProductsResult } from './types';
import { SyntheticProduct, Category } from '@/types/product';
import { PRODUCTS } from '@/lib/mock-data/products';
import { CATEGORIES } from '@/lib/mock-data/categories';
import { normalizeArabic } from '@/lib/utils/arabic';

/**
 * Generate character trigrams for pg_trgm algorithm simulation.
 * Pads the input string with two leading spaces and one trailing space.
 */
function getTrigrams(str: string): Set<string> {
  const padded = `  ${str.toLowerCase()} `;
  const trigrams = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) {
    trigrams.add(padded.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculate trigram similarity between 0.0 and 1.0 (Dice's coefficient)
 * matching PostgreSQL pg_trgm similarity() function.
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const triA = getTrigrams(a);
  const triB = getTrigrams(b);
  if (triA.size === 0 || triB.size === 0) return 0;

  let intersection = 0;
  triA.forEach(tri => {
    if (triB.has(tri)) intersection++;
  });
  return (2.0 * intersection) / (triA.size + triB.size);
}

/**
 * Calculate word-level trigram similarity against a target haystack.
 */
export function wordTrigramSimilarity(needle: string, haystack: string): number {
  if (!needle || !haystack) return 0;
  if (haystack.includes(needle)) return 1.0;
  const fullSim = calculateTrigramSimilarity(needle, haystack);
  const words = haystack.split(/\s+/).filter(w => w.length > 0);
  const needleWords = needle.split(/\s+/).filter(w => w.length > 0);
  let maxWordSim = 0;

  for (const word of words) {
    // Only compare words of compatible length to avoid short particle false positives
    const maxLenDelta = Math.max(2, Math.floor(needle.length * 0.4));
    if (Math.abs(needle.length - word.length) <= maxLenDelta) {
      const sim = calculateTrigramSimilarity(needle, word);
      if (sim > maxWordSim) maxWordSim = sim;
    }
  }

  // Sliding window matching pg_trgm word_similarity for multi-word phrases
  if (needleWords.length > 1 && words.length >= needleWords.length) {
    for (let i = 0; i <= words.length - needleWords.length; i++) {
      const windowStr = words.slice(i, i + needleWords.length).join(' ');
      const sim = calculateTrigramSimilarity(needle, windowStr);
      if (sim > maxWordSim) maxWordSim = sim;
    }
  }

  return Math.max(fullSim, maxWordSim);
}

/**
 * Egyptian dialect colloquial symptom dictionary mapping.
 * All keys must have length >= 2 to strictly prevent single-character blast radius.
 */
export const DIALECT_MAP: Record<string, string[]> = {
  'صداع': ['syntraphol-extra-500', 'syntraphol-nile-generic-500', 'vitamol-plus-fast'],
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
  'ضغط': ['cardiocare-x-10', 'cardiosynth-egypt-10', 'hypersynth-plus-combo', 'pressuresynth-monitor'],
  'سكر': ['glucofix-syn-500', 'glucofix-nile-domestic-500', 'glucosynth-test-strips'],
  'مفاصل': ['osteojoint-synth-extra', 'relaxogen-forte-relaxant'],
  'عضلات': ['relaxogen-forte-relaxant'],
  'ركبة': ['osteojoint-synth-extra'],
  'خشونة': ['osteojoint-synth-extra'],
  'جروح': ['septoderm-antiseptic-spray', 'dermoheal-plus-gel', 'safe-band-dressings'],
  'حروق': ['dermoheal-plus-gel'],
  'مطهر': ['septoderm-antiseptic-spray'],
  'عين': ['ocuclear-s-eye-drops'],
  'عيني': ['ocuclear-s-eye-drops'],
  'جفاف': ['ocuclear-s-eye-drops', 'dermoheal-plus-gel', 'healthy-care-sensitive-cream'],
  'نوم': ['sleepeasy-synth-night'],
  'أرق': ['sleepeasy-synth-night'],
  'أطفال': ['pediatric-cough-k-oral', 'kids-relief-fever-syrup', 'teething-care-gel', 'pediasynth-colic-drops', 'baby-rehydra-sachets'],
  'بشرة': ['healthy-care-sensitive-cream', 'acne-synth-lotion', 'dermoheal-plus-gel'],
  'حب شباب': ['acne-synth-lotion'],
  'تسنين': ['teething-care-gel'],
  'حرارة أطفال': ['pediatric-cough-k-oral', 'kids-relief-fever-syrup', 'thermosynth-digital-thermometer'],
};

export class MockCatalogRepository implements CatalogRepository {
  private static instance: MockCatalogRepository;
  private products: SyntheticProduct[] = [...PRODUCTS];
  private categories: Category[] = [...CATEGORIES];

  public static getInstance(): MockCatalogRepository {
    if (!MockCatalogRepository.instance) {
      MockCatalogRepository.instance = new MockCatalogRepository();
    }
    return MockCatalogRepository.instance;
  }

  async getProducts(options?: ProductFilterOptions): Promise<PaginatedProductsResult> {
    let result = [...this.products];

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

    if (options?.minPrice !== undefined) {
      result = result.filter(p => (p.salePriceEgp ?? p.priceEgp) >= options.minPrice!);
    }

    if (options?.maxPrice !== undefined) {
      result = result.filter(p => (p.salePriceEgp ?? p.priceEgp) <= options.maxPrice!);
    }

    if (options?.activeIngredient) {
      const normIng = normalizeArabic(options.activeIngredient);
      result = result.filter(p =>
        normalizeArabic(p.activeIngredientAr).includes(normIng) ||
        p.activeIngredientEn.toLowerCase().includes(options.activeIngredient!.toLowerCase())
      );
    }

    if (options?.dosageForm) {
      result = result.filter(p => p.dosageForm.toLowerCase() === options.dosageForm!.toLowerCase());
    }

    if (options?.search && options.search.trim().length > 0) {
      const rawQ = options.search.trim().toLowerCase();
      const normQ = normalizeArabic(options.search);

      // Check Egyptian dialect symptoms
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

    // Sorting
    if (options?.sort) {
      switch (options.sort as string) {
        case 'price_asc':
        case 'price-asc':
          result.sort((a, b) => (a.salePriceEgp ?? a.priceEgp) - (b.salePriceEgp ?? b.priceEgp));
          break;
        case 'price_desc':
        case 'price-desc':
          result.sort((a, b) => (b.salePriceEgp ?? b.priceEgp) - (a.salePriceEgp ?? a.priceEgp));
          break;
        case 'rating_desc':
        case 'rating':
        case 'popular':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'name_asc':
        case 'name-asc':
          result.sort((a, b) => a.nameAr.localeCompare(b.nameAr));
          break;
        case 'relevance':
          // Retain search score ordering
          break;
      }
    }

    // Pagination
    const total = result.length;
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.max(1, options?.pageSize || 12);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const paginatedItems = result.slice(offset, offset + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getProductById(id: string): Promise<SyntheticProduct | null> {
    const item = this.products.find(p => p.id === id);
    return item || null;
  }

  async getProductBySlug(slug: string): Promise<SyntheticProduct | null> {
    const item = this.products.find(p => p.slug === slug);
    return item || null;
  }

  async searchProducts(query: string, options?: Omit<ProductFilterOptions, 'search'>): Promise<PaginatedProductsResult> {
    return this.getProducts({ ...options, search: query });
  }

  async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const cat = this.categories.find(c => c.id === id);
    return cat || null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cat = this.categories.find(c => c.slug === slug);
    return cat || null;
  }

  async getSubstitute(productId: string): Promise<SyntheticProduct | null> {
    const target = await this.getProductById(productId);
    if (!target || !target.substituteId) return null;
    return this.getProductById(target.substituteId);
  }

  async getFeaturedProducts(limit: number = 8): Promise<SyntheticProduct[]> {
    return this.products.filter(p => !p.id.endsWith('-alt')).slice(0, limit);
  }
}
