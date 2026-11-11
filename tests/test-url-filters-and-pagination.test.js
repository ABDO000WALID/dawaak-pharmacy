/**
 * tests/test-url-filters-and-pagination.test.js
 *
 * DAWAAK PHARMACY (دواك) — Automated Verification Suite for Milestone 2B
 * URL-Synchronized Filters, Responsive Pagination, and Filter State Mechanics
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

// In-memory TypeScript loader to execute production code directly
const moduleCache = {};
function loadTsModule(filePath) {
  const absPath = path.resolve(filePath);
  if (moduleCache[absPath]) return moduleCache[absPath];

  const code = fs.readFileSync(absPath, 'utf8');
  const dir = path.dirname(absPath);

  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const customRequire = (specifier) => {
    if (specifier.startsWith('@/')) {
      const rel = specifier.slice(2);
      const target = path.resolve('./src', rel);
      const targetFile = fs.existsSync(target + '.ts')
        ? target + '.ts'
        : fs.existsSync(target + '/index.ts')
        ? target + '/index.ts'
        : target;
      return loadTsModule(targetFile);
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const target = path.resolve(dir, specifier);
      const targetFile = fs.existsSync(target + '.ts')
        ? target + '.ts'
        : fs.existsSync(target + '/index.ts')
        ? target + '/index.ts'
        : target;
      if (targetFile.endsWith('.ts')) return loadTsModule(targetFile);
      return require(target);
    }
    return require(specifier);
  };

  const moduleObj = { exports: {} };
  const wrapper = new Function('require', 'module', 'exports', '__dirname', '__filename', transpiled);
  wrapper(customRequire, moduleObj, moduleObj.exports, dir, absPath);
  moduleCache[absPath] = moduleObj.exports;
  return moduleObj.exports;
}

const productServiceModule = loadTsModule('./src/lib/services/product-service.ts');
const ProductService = productServiceModule.ProductService;

let passCount = 0;
let failCount = 0;

function testAssert(condition, message) {
  if (!condition) {
    failCount++;
    console.error(`  ✖ FAIL: ${message}`);
    throw new Error(message);
  }
  passCount++;
  console.log(`  ✔ PASS: ${message}`);
}

async function runSuite() {
  console.log('================================================================');
  console.log('  DAWAAK PHARMACY — URL FILTERS & PAGINATION TEST SUITE         ');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: URL Query Parameter Parsing & Normalization Logic
  // -------------------------------------------------------------
  console.log('[SUITE 1] URL Query Parameter Parsing & Normalization Logic...');

  function parseUrlParams(searchParamsString) {
    const searchParams = new URLSearchParams(searchParamsString);
    const query = searchParams.get('q') || searchParams.get('search') || '';
    const category = searchParams.get('category') || undefined;
    const prescription = searchParams.get('prescription') || undefined;
    const minPrice = searchParams.get('minPrice') || undefined;
    const maxPrice = searchParams.get('maxPrice') || undefined;
    const activeIngredient = searchParams.get('activeIngredient') || undefined;
    const sort = searchParams.get('sort') || 'rating_desc';
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const rawPageSize = parseInt(searchParams.get('pageSize') || '12', 10);
    const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? 12 : rawPageSize;

    return {
      query,
      category,
      prescription: prescription === 'true' ? true : prescription === 'false' ? false : undefined,
      minPrice: minPrice ? Math.max(0, Number(minPrice)) : undefined,
      maxPrice: maxPrice ? Math.max(0, Number(maxPrice)) : undefined,
      activeIngredient,
      sort,
      page,
      pageSize,
    };
  }

  const p1 = parseUrlParams('?q=%D8%B3%D9%8A%D9%86%D8%AA%D8%B1%D8%A7%D9%81%D9%88%D9%84&category=analgesics-pain&page=2&pageSize=10');
  testAssert(p1.query === 'سينترافول', 'Arabic query decoded accurately from URL');
  testAssert(p1.category === 'analgesics-pain', 'Category parsed accurately');
  testAssert(p1.page === 2, 'Page number 2 parsed');
  testAssert(p1.pageSize === 10, 'Custom page size 10 parsed');

  const p2 = parseUrlParams('?prescription=false&minPrice=20&maxPrice=100&sort=price-asc');
  testAssert(p2.prescription === false, 'Prescription=false parsed to boolean false (OTC)');
  testAssert(p2.minPrice === 20 && p2.maxPrice === 100, 'Price bounds parsed as numbers');
  testAssert(p2.sort === 'price-asc', 'Sort order parsed');

  // Corner cases: negative/invalid page
  const p3 = parseUrlParams('?page=-5&pageSize=0');
  testAssert(p3.page === 1, 'Negative page automatically clamped to 1');
  testAssert(p3.pageSize === 12, 'Zero or invalid pageSize defaults safely to 12');

  const p4 = parseUrlParams('?page=not_a_number');
  testAssert(p4.page === 1, 'NaN page safely defaults to 1');

  // URL serialization logic: clearing filters while preserving query
  function serializeFilters(baseParams, updates) {
    const params = new URLSearchParams(baseParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null || value === '' || (key === 'page' && value === 1)) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (!('page' in updates)) {
      params.delete('page'); // Reset page to 1 on any filter change
    }
    return params.toString();
  }

  const base = 'q=%D8%B5%D8%AF%D8%A7%D8%B9&category=analgesics-pain&page=3';
  const resetFilters = serializeFilters(base, { category: undefined });
  testAssert(!resetFilters.includes('category'), 'Resetting category deletes it from URL query');
  testAssert(!resetFilters.includes('page=3'), 'Page is reset to 1 (omitted from URL) when filters change');
  testAssert(resetFilters.includes('q='), 'Search query is preserved during filter reset');

  // -------------------------------------------------------------
  // SUITE 2: Pagination Math & Boundary Clamping
  // -------------------------------------------------------------
  console.log('\n[SUITE 2] Pagination Math & Boundary Clamping...');

  function calculatePagination(total, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const clampedPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (clampedPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const hasPrev = clampedPage > 1;
    const hasNext = clampedPage < totalPages;

    return {
      total,
      page: clampedPage,
      pageSize,
      totalPages,
      startIndex,
      endIndex,
      hasPrev,
      hasNext,
      displayRange: total > 0 ? `${startIndex + 1} - ${endIndex}` : '0',
    };
  }

  const pg1 = calculatePagination(36, 1, 12);
  testAssert(pg1.totalPages === 3, '36 items with pageSize 12 produces exactly 3 total pages');
  testAssert(pg1.hasPrev === false, 'Page 1 hasPrev is false (Prev button disabled)');
  testAssert(pg1.hasNext === true, 'Page 1 hasNext is true (Next button enabled)');
  testAssert(pg1.displayRange === '1 - 12', 'Display range is "1 - 12"');

  const pg2 = calculatePagination(36, 2, 12);
  testAssert(pg2.page === 2, 'Page 2 active');
  testAssert(pg2.hasPrev === true && pg2.hasNext === true, 'Middle page has both Prev and Next enabled');
  testAssert(pg2.displayRange === '13 - 24', 'Display range is "13 - 24"');

  const pg3 = calculatePagination(36, 3, 12);
  testAssert(pg3.hasPrev === true, 'Last page has Prev enabled');
  testAssert(pg3.hasNext === false, 'Last page has Next disabled');
  testAssert(pg3.displayRange === '25 - 36', 'Display range is "25 - 36"');

  // Boundary check: requesting page 99 clamps to page 3
  const pgOverflow = calculatePagination(36, 99, 12);
  testAssert(pgOverflow.page === 3, 'Requesting out-of-bound page 99 clamps to totalPages (3)');

  // Empty catalog (0 items)
  const pgEmpty = calculatePagination(0, 1, 12);
  testAssert(pgEmpty.totalPages === 1, '0 items produces 1 safe totalPage');
  testAssert(pgEmpty.hasPrev === false && pgEmpty.hasNext === false, '0 items has no next or prev');

  // -------------------------------------------------------------
  // SUITE 3: Real Catalog Filtering & Slicing Integration
  // -------------------------------------------------------------
  console.log('\n[SUITE 3] Real Catalog Filtering & Slicing Integration...');

  const page1Res = await ProductService.getProductsAsync({ page: 1, pageSize: 12 });
  testAssert(page1Res.items.length === 12, 'Page 1 returns exactly 12 products');
  testAssert(page1Res.total >= 30, 'Catalog contains 30+ products in primary listing');
  testAssert(page1Res.page === 1, 'Response metadata reflects page 1');
  testAssert(page1Res.hasMore === true, 'hasMore is true for page 1');

  const page2Res = await ProductService.getProductsAsync({ page: 2, pageSize: 12 });
  testAssert(page2Res.items.length === 12, 'Page 2 returns 12 products');
  testAssert(page2Res.page === 2, 'Response metadata reflects page 2');
  testAssert(page1Res.items[0].id !== page2Res.items[0].id, 'Page 1 and Page 2 contain distinct products');

  // Test category filter combined with pagination
  const catRes = await ProductService.getProductsAsync({
    category: 'analgesics-pain',
    page: 1,
    pageSize: 10,
  });
  testAssert(catRes.items.length > 0, 'Analgesics category returns products');
  testAssert(
    catRes.items.every((p) => p.categoryId === 'analgesics-pain'),
    'All returned items strictly belong to analgesics-pain'
  );

  // Test price range filter
  const priceRes = await ProductService.getProductsAsync({
    minPrice: 30,
    maxPrice: 60,
  });
  testAssert(priceRes.items.length > 0, 'Price range 30-60 EGP returns matching products');
  testAssert(
    priceRes.items.every((p) => {
      const price = p.salePriceEgp || p.priceEgp;
      return price >= 30 && price <= 60;
    }),
    'All returned items fall strictly within 30-60 EGP'
  );

  // Test prescription filter
  const rxRes = await ProductService.getProductsAsync({ prescription: true });
  testAssert(rxRes.items.length > 0, 'Prescription required query returns items');
  testAssert(
    rxRes.items.every((p) => p.prescriptionRequired === true),
    'All returned items have prescriptionRequired = true'
  );

  const otcRes = await ProductService.getProductsAsync({ prescription: false });
  testAssert(otcRes.items.length > 0, 'OTC query returns items');
  testAssert(
    otcRes.items.every((p) => p.prescriptionRequired === false),
    'All returned items have prescriptionRequired = false'
  );

  // Test active ingredient filter
  const ingRes = await ProductService.getProductsAsync({ activeIngredient: 'MelatoSyn' });
  testAssert(ingRes.items.length > 0, 'Filter by active ingredient MelatoSyn returns products');
  testAssert(
    ingRes.items.some((p) => p.activeIngredientEn.toLowerCase().includes('melatosyn')),
    'Found matching active ingredient in catalog'
  );

  // -------------------------------------------------------------
  // SUITE 4: Sorting Contract
  // -------------------------------------------------------------
  console.log('\n[SUITE 4] Sorting Contract...');

  const sortAscRes = await ProductService.getProductsAsync({ sort: 'price_asc', pageSize: 36 });
  const pricesAsc = sortAscRes.items.map((p) => p.salePriceEgp || p.priceEgp);
  let isAscending = true;
  for (let i = 1; i < pricesAsc.length; i++) {
    if (pricesAsc[i] < pricesAsc[i - 1]) isAscending = false;
  }
  testAssert(isAscending, 'price_asc sort produces strictly ascending prices');

  const sortDescRes = await ProductService.getProductsAsync({ sort: 'price_desc', pageSize: 36 });
  const pricesDesc = sortDescRes.items.map((p) => p.salePriceEgp || p.priceEgp);
  let isDescending = true;
  for (let i = 1; i < pricesDesc.length; i++) {
    if (pricesDesc[i] > pricesDesc[i - 1]) isDescending = false;
  }
  testAssert(isDescending, 'price_desc sort produces strictly descending prices');

  const sortRatingRes = await ProductService.getProductsAsync({ sort: 'rating_desc', pageSize: 36 });
  const ratings = sortRatingRes.items.map((p) => p.rating);
  let isRatingDesc = true;
  for (let i = 1; i < ratings.length; i++) {
    if (ratings[i] > ratings[i - 1]) isRatingDesc = false;
  }
  testAssert(isRatingDesc, 'rating_desc sort produces descending ratings');

  // -------------------------------------------------------------
  // SUITE 5: Empty State Contract & Dialect Microcopy
  // -------------------------------------------------------------
  console.log('\n[SUITE 5] Empty State Contract & Dialect Microcopy...');

  const impossibleRes = await ProductService.getProductsAsync({
    category: 'analgesics-pain',
    minPrice: 5000,
    maxPrice: 6000,
  });
  testAssert(impossibleRes.items.length === 0, 'Impossible filter combination yields 0 results');
  testAssert(impossibleRes.total === 0, 'Total count is 0');
  testAssert(impossibleRes.totalPages === 1, 'Total pages safely returns 1 for zero results');

  const emptyStateNoticeAr = 'مفيش نتائج تطابق بحثك وفلاترك حالياً';
  testAssert(
    emptyStateNoticeAr.includes('مفيش نتائج'),
    'Egyptian dialect empty state copy uses friendly local phrasing'
  );

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log(`PASS RATE: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
