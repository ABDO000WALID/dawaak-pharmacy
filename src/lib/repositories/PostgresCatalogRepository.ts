import { CatalogRepository, ProductFilterOptions, PaginatedProductsResult } from './types';
import { SyntheticProduct, Category, CategoryId, DosageForm, TimingBucket } from '@/types/product';

interface DatabaseProductRow {
  id: string;
  sku: string;
  slug: string;
  name_ar: string;
  name_en: string;
  category_id: CategoryId;
  active_ingredient_ar?: string;
  active_ingredient_en?: string;
  active_ingredient?: string;
  concentration: string;
  dosage_form: DosageForm;
  dosage_form_ar: string;
  pack_size: string;
  pack_size_ar: string;
  manufacturer: string;
  manufacturer_ar: string;
  price_egp: number | string;
  sale_price_egp?: number | string | null;
  stock_quantity: number;
  min_order_quantity: number;
  max_order_quantity: number;
  prescription_required: boolean;
  storage_conditions: string;
  storage_conditions_ar: string;
  images: string[] | string;
  description_ar: string;
  description_en: string;
  dosage_instructions_ar: string;
  dosage_instructions_en: string;
  warnings_ar: string[] | string;
  warnings_en: string[] | string;
  is_synthetic: boolean;
  synthetic_disclaimer_ar: string;
  synthetic_disclaimer_en: string;
  rating?: number | string;
  reviews_count?: number;
  substitute_id?: string | null;
  substitute_savings_egp?: number | string | null;
  timing_bucket?: TimingBucket | null;
}

interface DatabaseCategoryRow {
  id: CategoryId;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar?: string | null;
  description_en?: string | null;
  icon_name: string;
  display_order: number;
  is_active?: boolean;
}

export class PostgresCatalogRepository implements CatalogRepository {
  private static instance: PostgresCatalogRepository;
  // Supabase client instance (dynamic import)
  // deno-lint-ignore no-explicit-any
  private supabaseClient: any = null;

  public static getInstance(): PostgresCatalogRepository {
    if (!PostgresCatalogRepository.instance) {
      PostgresCatalogRepository.instance = new PostgresCatalogRepository();
    }
    return PostgresCatalogRepository.instance;
  }

  private async getClient() {
    if (!this.supabaseClient) {
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        throw new Error(
          'Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are missing. ' +
          'Configure them in .env.local or use DATA_SOURCE=mock.'
        );
      }
      try {
        // Dynamic import to avoid build-time failure when @supabase/supabase-js is not installed
        const pkg = '@supabase/supabase-js';
        const supabaseMod: any = await import(/* webpackIgnore: true */ pkg);
        this.supabaseClient = supabaseMod.createClient(url, key);
      } catch (err: unknown) {
        const error = err as Error;
        throw new Error(`Failed to initialize Supabase client: ${error?.message || String(err)}`);
      }
    }
    return this.supabaseClient;
  }

  async getProducts(options?: ProductFilterOptions): Promise<PaginatedProductsResult> {
    const client = await this.getClient();
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.max(1, options?.pageSize || 12);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // If search term is present, delegate to pg_trgm fuzzy RPC
    if (options?.search && options.search.trim().length > 0) {
      const { data, count, error } = await client.rpc('search_products_fuzzy', {
        search_term: options.search.trim(),
        filter_category: options.category || null,
        filter_prescription: options.prescription !== undefined ? options.prescription : null,
        min_price: options.minPrice || null,
        max_price: options.maxPrice || null,
        limit_count: pageSize,
        offset_count: from,
      }, { count: 'exact' });

      if (error) throw error;

      const total = count || (data ? data.length : 0);
      return {
        items: (data || []).map((row: DatabaseProductRow) => this.mapDbToProduct(row)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
        hasMore: page * pageSize < total,
      };
    }

    // Standard relational query builder
    let query = client.from('products').select('*', { count: 'exact' });

    if (!options?.category) {
      query = query.not('id', 'like', '%-alt');
    } else {
      query = query.eq('category_id', options.category);
    }

    if (options?.prescription !== undefined) {
      query = query.eq('prescription_required', options.prescription);
    }

    if (options?.minPrice !== undefined) {
      query = query.gte('price_egp', options.minPrice);
    }

    if (options?.maxPrice !== undefined) {
      query = query.lte('price_egp', options.maxPrice);
    }

    if (options?.sort) {
      switch (options.sort as string) {
        case 'price_asc':
        case 'price-asc':
          query = query.order('price_egp', { ascending: true });
          break;
        case 'price_desc':
        case 'price-desc':
          query = query.order('price_egp', { ascending: false });
          break;
        case 'rating_desc':
        case 'rating':
        case 'popular':
          query = query.order('rating', { ascending: false });
          break;
        case 'name_asc':
        case 'name-asc':
          query = query.order('name_ar', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const total = count || 0;
    return {
      items: (data || []).map((row: DatabaseProductRow) => this.mapDbToProduct(row)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      hasMore: page * pageSize < total,
    };
  }

  async getProductById(id: string): Promise<SyntheticProduct | null> {
    const client = await this.getClient();
    const { data, error } = await client.from('products').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this.mapDbToProduct(data);
  }

  async getProductBySlug(slug: string): Promise<SyntheticProduct | null> {
    const client = await this.getClient();
    const { data, error } = await client.from('products').select('*').eq('slug', slug).maybeSingle();
    if (error || !data) return null;
    return this.mapDbToProduct(data);
  }

  async searchProducts(query: string, options?: Omit<ProductFilterOptions, 'search'>): Promise<PaginatedProductsResult> {
    return this.getProducts({ ...options, search: query });
  }

  async getCategories(): Promise<Category[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error || !data) return [];
    return data.map((row: DatabaseCategoryRow) => this.mapDbToCategory(row));
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const client = await this.getClient();
    const { data, error } = await client.from('categories').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this.mapDbToCategory(data);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const client = await this.getClient();
    const { data, error } = await client.from('categories').select('*').eq('slug', slug).maybeSingle();
    if (error || !data) return null;
    return this.mapDbToCategory(data);
  }

  async getSubstitute(productId: string): Promise<SyntheticProduct | null> {
    const product = await this.getProductById(productId);
    if (!product || !product.substituteId) return null;
    return this.getProductById(product.substituteId);
  }

  async getFeaturedProducts(limit: number = 8): Promise<SyntheticProduct[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .not('id', 'like', '%-alt')
      .order('rating', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row: DatabaseProductRow) => this.mapDbToProduct(row));
  }

  private mapDbToProduct(row: DatabaseProductRow): SyntheticProduct {
    const parseJson = (val: string[] | string | undefined): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    };

    return {
      id: row.id,
      sku: row.sku,
      slug: row.slug,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      categoryId: row.category_id,
      activeIngredientAr: row.active_ingredient_ar || row.active_ingredient || '',
      activeIngredientEn: row.active_ingredient_en || row.active_ingredient || '',
      concentration: row.concentration,
      dosageForm: row.dosage_form,
      dosageFormAr: row.dosage_form_ar,
      packSize: row.pack_size,
      packSizeAr: row.pack_size_ar,
      manufacturer: row.manufacturer,
      manufacturerAr: row.manufacturer_ar,
      priceEgp: Number(row.price_egp),
      salePriceEgp: row.sale_price_egp !== null && row.sale_price_egp !== undefined ? Number(row.sale_price_egp) : undefined,
      stockQuantity: Number(row.stock_quantity),
      minOrderQuantity: Number(row.min_order_quantity) || 1,
      maxOrderQuantity: Number(row.max_order_quantity) || 5,
      prescriptionRequired: Boolean(row.prescription_required),
      storageConditions: row.storage_conditions,
      storageConditionsAr: row.storage_conditions_ar,
      images: parseJson(row.images),
      descriptionAr: row.description_ar,
      descriptionEn: row.description_en,
      dosageInstructionsAr: row.dosage_instructions_ar,
      dosageInstructionsEn: row.dosage_instructions_en,
      warningsAr: parseJson(row.warnings_ar),
      warningsEn: parseJson(row.warnings_en),
      isSynthetic: true,
      syntheticDisclaimerAr: row.synthetic_disclaimer_ar,
      syntheticDisclaimerEn: row.synthetic_disclaimer_en,
      rating: Number(row.rating || 5.0),
      reviewsCount: Number(row.reviews_count || 0),
      substituteId: row.substitute_id || undefined,
      substituteSavingsEgp: row.substitute_savings_egp !== null && row.substitute_savings_egp !== undefined ? Number(row.substitute_savings_egp) : undefined,
      timingBucket: (row.timing_bucket as TimingBucket) || undefined,
    };
  }

  private mapDbToCategory(row: DatabaseCategoryRow): Category {
    return {
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      slug: row.slug,
      descriptionAr: row.description_ar || '',
      descriptionEn: row.description_en || '',
      iconName: row.icon_name,
      displayOrder: Number(row.display_order),
    };
  }
}
