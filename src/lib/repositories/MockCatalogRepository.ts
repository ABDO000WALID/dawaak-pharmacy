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

      // Check Egyptian dialect symptoms with dynamic multi-factor scoring
      const dialectScores = new Map<string, number>();
      for (const [symptom, slugs] of Object.entries(DIALECT_MAP)) {
        const normSymptom = normalizeArabic(symptom);
        const isMatch =
          (normQ && (normQ.includes(normSymptom) || (normQ.length >= 2 && normSymptom.includes(normQ)))) ||
          (rawQ && (rawQ.includes(symptom.toLowerCase()) || (rawQ.length >= 2 && symptom.toLowerCase().includes(rawQ))));

        if (isMatch) {
          const listLen = slugs.length || 1;
          const lenRatio = Math.min(1.0, normSymptom.length / Math.max(1, normQ.length));
          const trigramSim = wordTrigramSimilarity(normSymptom, normQ);
          const coverageFactor = Math.max(lenRatio, trigramSim);

          slugs.forEach((slug, rankIdx) => {
            const priorityFactor = 1 - (rankIdx / (listLen + 1)) * 0.15;
            const dynamicScore = 0.78 + (0.08 * priorityFactor) + (0.05 * coverageFactor);
            const prev = dialectScores.get(slug) || 0;
            if (dynamicScore > prev) {
              dialectScores.set(slug, dynamicScore);
            }
          });
        }
      }

      const scored = result.map(p => {
        let score = 0;
        const baseDialectScore = dialectScores.get(p.slug);
        const isDialectMatch = baseDialectScore !== undefined;
        if (isDialectMatch) {
          let formBonus = 0;
          const dosageAr = normalizeArabic(p.dosageFormAr || '');
          const dosageFormLower = (p.dosageForm || '').toLowerCase();
          if ((normQ.includes('فوار') && (dosageAr.includes('فوار') || p.slug.includes('effervescent') || dosageFormLower.includes('effervescent'))) ||
              (normQ.includes('شراب') && (dosageAr.includes('شراب') || dosageFormLower.includes('syrup'))) ||
              (normQ.includes('قطرة') && (dosageAr.includes('قطرة') || dosageFormLower.includes('drop'))) ||
              (normQ.includes('كبسول') && (dosageAr.includes('كبسول') || dosageFormLower.includes('capsule')))) {
            formBonus = 0.04;
          }
          score += baseDialectScore + formBonus;
        }

        const normNameAr = normalizeArabic(p.nameAr);
        const normActiveAr = normalizeArabic(p.activeIngredientAr);
        const normDescAr = normalizeArabic(p.descriptionAr);
        const nameEn = p.nameEn.toLowerCase();
        const activeEn = p.activeIngredientEn.toLowerCase();
        const descEn = p.descriptionEn.toLowerCase();

        const arTokens = normQ.split(/\s+/).filter(t => t.length >= 3);
        const enTokens = rawQ.split(/\s+/).filter(t => t.length >= 3);

        const nameWordsAr = normNameAr.split(/\s+/);
        const activeWordsAr = normActiveAr.split(/\s+/);
        const allWordsAr = [...nameWordsAr, ...activeWordsAr];
        const matchedArTokens = arTokens.filter(t => allWordsAr.includes(t));
        const multiTokenArMatch = arTokens.length > 1 &&
          matchedArTokens.length >= Math.min(2, arTokens.length) &&
          matchedArTokens.length >= Math.ceil(arTokens.length * 0.5);

        const nameWordsEn = nameEn.split(/\s+/);
        const activeWordsEn = activeEn.split(/\s+/);
        const allWordsEn = [...nameWordsEn, ...activeWordsEn];
        const matchedEnTokens = enTokens.filter(t => allWordsEn.includes(t));
        const multiTokenEnMatch = enTokens.length > 1 &&
          matchedEnTokens.length >= Math.min(2, enTokens.length) &&
          matchedEnTokens.length >= Math.ceil(enTokens.length * 0.5);

        const matchesArabic = normQ.length > 0 && (
          normNameAr.includes(normQ) ||
          normActiveAr.includes(normQ) ||
          normDescAr.includes(normQ) ||
          multiTokenArMatch
        );

        const matchesEnglish = rawQ.length > 0 && (
          nameEn.includes(rawQ) ||
          activeEn.includes(rawQ) ||
          descEn.includes(rawQ) ||
          multiTokenEnMatch
        );

        if (matchesArabic) score += 0.9;
        if (matchesEnglish) score += 0.9;

        // Trigram fuzzy similarity (tolerance for typos matching pg_trgm word_similarity)
        const simNameAr = wordTrigramSimilarity(normQ, normNameAr);
        const simActiveAr = wordTrigramSimilarity(normQ, normActiveAr);
        const simNameEn = wordTrigramSimilarity(rawQ, nameEn);
        const simActiveEn = wordTrigramSimilarity(rawQ, activeEn);

        const bestSim = Math.max(simNameAr, simActiveAr, simNameEn, simActiveEn);
        const simThreshold = (arTokens.length >= 3 || enTokens.length >= 3) ? 0.32 : 0.28;
        if (bestSim >= simThreshold) {
          score += bestSim * 0.75;
        }

        return { product: p, score, matched: isDialectMatch || matchesArabic || matchesEnglish || bestSim >= simThreshold };
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
