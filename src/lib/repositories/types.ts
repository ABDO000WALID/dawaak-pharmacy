import { SyntheticProduct, Category } from '@/types/product';

export interface ProductFilterOptions {
  category?: string;
  search?: string;
  prescription?: boolean;
  minPrice?: number;
  maxPrice?: number;
  activeIngredient?: string;
  dosageForm?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc' | 'relevance';
  page?: number;        // 1-based index (default: 1)
  pageSize?: number;    // items per page (default: 12)
}

export interface PaginatedProductsResult {
  items: SyntheticProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CatalogRepository {
  /**
   * Retrieves a paginated and filtered list of products.
   */
  getProducts(options?: ProductFilterOptions): Promise<PaginatedProductsResult>;

  /**
   * Retrieves a single product by its unique ID.
   */
  getProductById(id: string): Promise<SyntheticProduct | null>;

  /**
   * Retrieves a single product by its URL slug.
   */
  getProductBySlug(slug: string): Promise<SyntheticProduct | null>;

  /**
   * Executes a typo-tolerant fuzzy search query.
   */
  searchProducts(query: string, options?: Omit<ProductFilterOptions, 'search'>): Promise<PaginatedProductsResult>;

  /**
   * Retrieves all active catalog categories.
   */
  getCategories(): Promise<Category[]>;

  /**
   * Retrieves a single category by its identifier.
   */
  getCategoryById(id: string): Promise<Category | null>;

  /**
   * Retrieves a single category by its slug.
   */
  getCategoryBySlug(slug: string): Promise<Category | null>;

  /**
   * Retrieves the bioequivalent generic substitute for a product.
   */
  getSubstitute(productId: string): Promise<SyntheticProduct | null>;

  /**
   * Retrieves featured products for the storefront home showcase.
   */
  getFeaturedProducts(limit?: number): Promise<SyntheticProduct[]>;
}
