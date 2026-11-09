import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';
import { ProductFilterOptions } from '@/lib/repositories/types';

/**
 * GET /api/products
 * Server-side route handler with support for typo-tolerant fuzzy search (pg_trgm parity),
 * category filtering, prescription filter, price ranges, active ingredients, dosage forms,
 * sorting, and URL-synchronized pagination.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest | Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const rawSearch = searchParams.get('q') || searchParams.get('search') || '';
    const trimmedSearch = rawSearch.trim();
    const search = trimmedSearch.length > 0 ? trimmedSearch : undefined;

    const category = searchParams.get('category')?.trim() || undefined;

    const prescriptionParam = searchParams.get('prescription');
    let prescription: boolean | undefined = undefined;
    if (prescriptionParam === 'true') {
      prescription = true;
    } else if (prescriptionParam === 'false') {
      prescription = false;
    }

    const minPriceParam = searchParams.get('minPrice');
    const minPrice =
      minPriceParam !== null && minPriceParam !== '' && !isNaN(Number(minPriceParam))
        ? Math.max(0, Number(minPriceParam))
        : undefined;

    const maxPriceParam = searchParams.get('maxPrice');
    const maxPrice =
      maxPriceParam !== null && maxPriceParam !== '' && !isNaN(Number(maxPriceParam))
        ? Math.max(0, Number(maxPriceParam))
        : undefined;

    const activeIngredient = searchParams.get('activeIngredient')?.trim() || undefined;
    const dosageForm = searchParams.get('dosageForm')?.trim() || undefined;

    const rawSort = searchParams.get('sort')?.trim();
    let sort: ProductFilterOptions['sort'] = undefined;
    if (rawSort) {
      if (rawSort === 'price-asc' || rawSort === 'price_asc') {
        sort = 'price_asc';
      } else if (rawSort === 'price-desc' || rawSort === 'price_desc') {
        sort = 'price_desc';
      } else if (rawSort === 'rating' || rawSort === 'rating_desc' || rawSort === 'popular') {
        sort = 'rating_desc';
      } else if (rawSort === 'name-asc' || rawSort === 'name_asc') {
        sort = 'name_asc';
      } else if (rawSort === 'relevance') {
        sort = 'relevance';
      }
    }

    const pageParam = searchParams.get('page');
    const page =
      pageParam && !isNaN(parseInt(pageParam, 10))
        ? Math.max(1, parseInt(pageParam, 10))
        : 1;

    const limitParam = searchParams.get('pageSize') || searchParams.get('limit');
    const pageSize =
      limitParam && !isNaN(parseInt(limitParam, 10))
        ? Math.max(1, parseInt(limitParam, 10))
        : 12;

    // Delegate to the repository via ProductService
    const filterOptions: ProductFilterOptions = {
      search,
      category,
      prescription,
      minPrice,
      maxPrice,
      activeIngredient,
      dosageForm,
      sort,
      page,
      pageSize,
    };

    const result = await ProductService.getProductsAsync(filterOptions);

    // Build filtersApplied object
    const filtersApplied: Record<string, string | number | boolean> = {};
    if (search) filtersApplied.search = search;
    if (category) filtersApplied.category = category;
    if (prescription !== undefined) filtersApplied.prescription = prescription;
    if (minPrice !== undefined) filtersApplied.minPrice = minPrice;
    if (maxPrice !== undefined) filtersApplied.maxPrice = maxPrice;
    if (activeIngredient) filtersApplied.activeIngredient = activeIngredient;
    if (dosageForm) filtersApplied.dosageForm = dosageForm;
    if (rawSort) filtersApplied.sort = rawSort;

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
      filtersApplied,
    });
  } catch (error) {
    console.error('Error fetching products in route handler:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
