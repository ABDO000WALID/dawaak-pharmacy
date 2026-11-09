'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductService } from '@/lib/services/product-service';
import { ProductCard } from '@/components/product/ProductCard';
import { SubstituteFinderModal } from '@/components/product/SubstituteFinderModal';
import { SearchFilterDrawer, FilterState } from '@/components/search/SearchFilterDrawer';
import { SearchPageSkeleton } from '@/components/search/SearchPageSkeleton';
import { SyntheticProduct } from '@/types/product';
import { ProductFilterOptions } from '@/lib/repositories/types';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  X,
  Pill,
  FileText,
  Sparkles,
} from 'lucide-react';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocaleStore();

  // 1. Single Source of Truth: URL Search Params
  const query = searchParams.get('q') || searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || undefined;
  const currentPrescription = (searchParams.get('prescription') as 'true' | 'false') || undefined;
  const currentMinPrice = searchParams.get('minPrice') || undefined;
  const currentMaxPrice = searchParams.get('maxPrice') || undefined;
  const currentActiveIngredient = searchParams.get('activeIngredient') || undefined;
  const currentSort = searchParams.get('sort') || 'rating_desc';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const currentPageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '12', 10) || 12);

  // Component state
  const [products, setProducts] = useState<SyntheticProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: currentPage,
    pageSize: currentPageSize,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [substituteTarget, setSubstituteTarget] = useState<SyntheticProduct | null>(null);

  const categories = useMemo(() => ProductService.getCategories(), []);

  // Map sort string to repository sort type
  const mappedSort = useMemo((): ProductFilterOptions['sort'] => {
    switch (currentSort) {
      case 'price-asc':
      case 'price_asc':
        return 'price_asc';
      case 'price-desc':
      case 'price_desc':
        return 'price_desc';
      case 'name-asc':
      case 'name_asc':
        return 'name_asc';
      case 'relevance':
        return 'relevance';
      case 'rating':
      case 'popular':
      case 'rating_desc':
      default:
        return 'rating_desc';
    }
  }, [currentSort]);

  // Synchronize URL query params
  const updateUrl = useCallback(
    (updates: Record<string, string | number | boolean | undefined | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === '' || (key === 'page' && value === 1)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      // Reset page to 1 whenever any filter or sort other than 'page' is modified
      if (!('page' in updates)) {
        params.delete('page');
      }

      const queryString = params.toString();
      const newPath = queryString ? `/search?${queryString}` : '/search';
      router.push(newPath, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch products from server route handler with fallback to repository
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const filterOptions: ProductFilterOptions = {
      search: query.trim() || undefined,
      category: currentCategory,
      prescription:
        currentPrescription !== undefined ? currentPrescription === 'true' : undefined,
      minPrice: currentMinPrice ? Math.max(0, Number(currentMinPrice)) : undefined,
      maxPrice: currentMaxPrice ? Math.max(0, Number(currentMaxPrice)) : undefined,
      activeIngredient: currentActiveIngredient?.trim() || undefined,
      sort: mappedSort,
      page: currentPage,
      pageSize: currentPageSize,
    };

    const loadData = async () => {
      // 1. Try server route handler first
      try {
        const params = new URLSearchParams(searchParams.toString());
        // Default page and pageSize if missing
        if (!params.has('page')) params.set('page', String(currentPage));
        if (!params.has('pageSize')) params.set('pageSize', String(currentPageSize));

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json.success) {
            setProducts(json.data);
            setPagination(json.pagination);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fetch failed (e.g. offline, static build), proceed to repository fallback
      }

      // 2. Direct repository query fallback
      try {
        const repoResult = await ProductService.getProductsAsync(filterOptions);
        if (!isCancelled) {
          setProducts(repoResult.items);
          setPagination({
            page: repoResult.page,
            pageSize: repoResult.pageSize,
            total: repoResult.total,
            totalPages: repoResult.totalPages,
            hasMore: repoResult.hasMore,
          });
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load catalog products:', err);
          setProducts([]);
          setPagination({
            page: 1,
            pageSize: currentPageSize,
            total: 0,
            totalPages: 1,
            hasMore: false,
          });
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [
    searchParams,
    query,
    currentCategory,
    currentPrescription,
    currentMinPrice,
    currentMaxPrice,
    currentActiveIngredient,
    mappedSort,
    currentPage,
    currentPageSize,
  ]);

  const substituteProduct = useMemo(() => {
    if (!substituteTarget) return undefined;
    return ProductService.getSubstitute(substituteTarget.id);
  }, [substituteTarget]);

  // Active filters count (excluding search query and default sort)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (currentCategory) count++;
    if (currentPrescription !== undefined) count++;
    if (currentMinPrice) count++;
    if (currentMaxPrice) count++;
    if (currentActiveIngredient) count++;
    if (currentSort && currentSort !== 'rating_desc') count++;
    return count;
  }, [
    currentCategory,
    currentPrescription,
    currentMinPrice,
    currentMaxPrice,
    currentActiveIngredient,
    currentSort,
  ]);

  // Handlers for filter drawer
  const handleApplyDrawerFilters = (newFilters: FilterState) => {
    updateUrl({
      category: newFilters.category,
      prescription: newFilters.prescription,
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      activeIngredient: newFilters.activeIngredient,
      sort: newFilters.sort,
    });
  };

  const handleResetAllFilters = () => {
    updateUrl({
      category: undefined,
      prescription: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      activeIngredient: undefined,
      sort: 'rating_desc',
    });
  };

  // Pagination navigation helpers
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    updateUrl({ page: newPage });
  };

  // Calculate item range summary for pagination
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  const activeCategoryObj = useMemo(() => {
    if (!currentCategory) return undefined;
    return categories.find((c) => c.id === currentCategory);
  }, [currentCategory, categories]);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-teal-700 dark:hover:text-teal-400 transition font-cairo">
          {locale === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        {locale === 'ar' ? (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        )}
        <Link
          href="/search"
          className="hover:text-teal-700 dark:hover:text-teal-400 transition font-cairo font-bold text-slate-700 dark:text-slate-300"
        >
          {locale === 'ar' ? 'نتائج البحث والكتالوج' : 'Search & Catalog'}
        </Link>
        {query && (
          <>
            {locale === 'ar' ? (
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="text-teal-700 dark:text-teal-400 truncate max-w-xs font-semibold font-cairo">
              &ldquo;{query}&rdquo;
            </span>
          </>
        )}
      </nav>

      {/* Query Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-cairo">
            {query ? (
              <>
                {locale === 'ar' ? 'نتائج البحث عن:' : 'Search results for:'}{' '}
                <span className="text-teal-700 dark:text-teal-400">&ldquo;{query}&rdquo;</span>
              </>
            ) : activeCategoryObj ? (
              <>
                {locale === 'ar' ? 'قسم:' : 'Category:'}{' '}
                <span className="text-teal-700 dark:text-teal-400">
                  {locale === 'ar' ? activeCategoryObj.nameAr : activeCategoryObj.nameEn}
                </span>
              </>
            ) : (
              locale === 'ar' ? 'جميع الأدوية والمستحضرات المرخصة' : 'All Licensed Medicines'
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-cairo">
            {locale === 'ar'
              ? `عرض ${startItem} - ${endItem} من إجمالي ${pagination.total} مستحضر دوائي مرخص`
              : `Showing ${startItem} - ${endItem} of ${pagination.total} licensed medicines`}
          </p>
        </div>

        {/* Top Controls: Filter Drawer Trigger & Sort Select */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Filter Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            aria-label={locale === 'ar' ? 'فتح لوحة الفلاتر' : 'Open filter drawer'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-cairo border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>{locale === 'ar' ? 'الفلاتر' : 'Filters'}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="search-sort"
              className="text-xs text-slate-500 shrink-0 font-medium hidden md:flex items-center gap-1 font-cairo"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{locale === 'ar' ? 'الترتيب:' : 'Sort:'}</span>
            </label>
            <select
              id="search-sort"
              value={currentSort}
              onChange={(e) => updateUrl({ sort: e.target.value })}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600 font-cairo"
            >
              <option value="rating_desc">{locale === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
              <option value="price_asc">{locale === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
              <option value="price_desc">{locale === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
              <option value="name_asc">{locale === 'ar' ? 'الاسم أبجدياً' : 'Name: Alphabetical'}</option>
              <option value="relevance">{locale === 'ar' ? 'الأكثر تطابقاً' : 'Relevance'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => updateUrl({ category: undefined })}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition font-cairo ${
            currentCategory === undefined
              ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {locale === 'ar' ? 'كل الأقسام' : 'All Categories'}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => updateUrl({ category: currentCategory === cat.id ? undefined : cat.id })}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition font-cairo ${
              currentCategory === cat.id
                ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {locale === 'ar' ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Active Filter Chips Strip */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-300 font-cairo flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
          </span>

          {/* Active Category Chip */}
          {activeCategoryObj && (
            <button
              type="button"
              onClick={() => updateUrl({ category: undefined })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100/60 transition font-cairo"
            >
              <span>{locale === 'ar' ? `القسم: ${activeCategoryObj.nameAr}` : `Category: ${activeCategoryObj.nameEn}`}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Prescription Chip */}
          {currentPrescription !== undefined && (
            <button
              type="button"
              onClick={() => updateUrl({ prescription: undefined })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100/60 transition font-cairo"
            >
              <Pill className="w-3 h-3" />
              <span>
                {currentPrescription === 'true'
                  ? locale === 'ar' ? 'أدوية بروشتة Rx' : 'Rx Only'
                  : locale === 'ar' ? 'بدون روشتة OTC' : 'OTC Only'}
              </span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Price Range Chip */}
          {(currentMinPrice || currentMaxPrice) && (
            <button
              type="button"
              onClick={() => updateUrl({ minPrice: undefined, maxPrice: undefined })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100/60 transition font-cairo"
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {locale === 'ar'
                  ? `السعر: ${currentMinPrice || 0} إلى ${currentMaxPrice || '...'} ج.م`
                  : `Price: ${currentMinPrice || 0} to ${currentMaxPrice || '...'} EGP`}
              </span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Active Ingredient Chip */}
          {currentActiveIngredient && (
            <button
              type="button"
              onClick={() => updateUrl({ activeIngredient: undefined })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100/60 transition font-cairo"
            >
              <FileText className="w-3 h-3" />
              <span>
                {locale === 'ar'
                  ? `المادة الفعالة: ${currentActiveIngredient}`
                  : `Ingredient: ${currentActiveIngredient}`}
              </span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Reset All Filters Button */}
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold font-cairo ms-auto px-2 py-1 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'مسح الفلاتر' : 'Clear all'}</span>
          </button>
        </div>
      )}

      {/* Results View: Shimmering Skeleton vs Empty State vs Product Cards Grid */}
      {isLoading ? (
        <SearchPageSkeleton cardCount={currentPageSize} />
      ) : products.length === 0 ? (
        /* Empty State with Egyptian Dialect */
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 font-cairo">
              {locale === 'ar'
                ? `مفيش نتائج تطابق بحثك وفلاترك${query ? ` لـ "${query}"` : ''}`
                : `No results matching your filters${query ? ` for "${query}"` : ''}`}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-cairo">
              {locale === 'ar'
                ? 'جرب تغير الفلاتر أو تبحث باسم تاني، أو اتأكد من كتابة الاسم التجاري أو المادة الفعالة صح (تقدر تبحث بالأعراض زي: صداع، سخونية، كحة، مغص).'
                : 'Try adjusting your filters, searching by another name, or checking the trade/active ingredient spelling.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="px-4 py-2.5 rounded-xl border border-teal-600 dark:border-teal-500 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-50 dark:hover:bg-teal-950/40 transition font-cairo flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'إلغاء كل الفلاتر' : 'Clear All Filters'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/search')}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition font-cairo shadow-sm"
            >
              {locale === 'ar' ? 'تصفح كل أدوية الصيدلية' : 'Browse All Medicines'}
            </button>
          </div>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenSubstitute={(p) => setSubstituteTarget(p)}
            />
          ))}
        </div>
      )}

      {/* Accessible Responsive Pagination Bar */}
      {!isLoading && pagination.totalPages > 1 && (
        <nav
          aria-label="صفحات نتائج البحث"
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          {/* Summary Text */}
          <div className="text-xs text-slate-500 font-medium font-cairo">
            {locale === 'ar'
              ? `عرض ${startItem} - ${endItem} من ${pagination.total} مستحضر دوائي (صفحة ${pagination.page} من ${pagination.totalPages})`
              : `Showing ${startItem} - ${endItem} of ${pagination.total} items (Page ${pagination.page} of ${pagination.totalPages})`}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* Previous Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label={locale === 'ar' ? 'الصفحة السابقة' : 'Previous page'}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold font-cairo border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
            >
              {locale === 'ar' ? (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </>
              )}
            </button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                const isActive = pageNumber === pagination.page;

                // For large page counts, only show window around current page
                if (
                  pagination.totalPages > 7 &&
                  pageNumber !== 1 &&
                  pageNumber !== pagination.totalPages &&
                  Math.abs(pageNumber - pagination.page) > 1
                ) {
                  if (pageNumber === 2 || pageNumber === pagination.totalPages - 1) {
                    return (
                      <span key={pageNumber} className="px-1 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handlePageChange(pageNumber)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`صفحة ${pageNumber}`}
                    className={`w-9 h-9 rounded-xl text-xs font-bold font-cairo transition ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || !pagination.hasMore}
              aria-label={locale === 'ar' ? 'الصفحة التالية' : 'Next page'}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold font-cairo border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
            >
              {locale === 'ar' ? (
                <>
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </nav>
      )}

      {/* Filter Drawer Modal */}
      <SearchFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        categories={categories}
        currentFilters={{
          category: currentCategory,
          prescription: currentPrescription,
          minPrice: currentMinPrice,
          maxPrice: currentMaxPrice,
          activeIngredient: currentActiveIngredient,
          sort: currentSort,
        }}
        onApplyFilters={handleApplyDrawerFilters}
        onResetFilters={handleResetAllFilters}
        totalResultsCount={pagination.total}
      />

      {/* Substitute Finder Modal */}
      {substituteTarget && (
        <SubstituteFinderModal
          isOpen={!!substituteTarget}
          onClose={() => setSubstituteTarget(null)}
          product={substituteTarget}
          substituteProduct={substituteProduct}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton cardCount={12} />}>
      <SearchContent />
    </Suspense>
  );
}
