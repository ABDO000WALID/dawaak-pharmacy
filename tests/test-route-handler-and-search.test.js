/**
 * Automated Verification Suite: Route Handler, Typo Tolerance, and Advanced Search
 * Tests cover:
 * 1. Typo tolerance parity (pg_trgm wordTrigramSimilarity in Arabic & English)
 * 2. Active ingredient search in Arabic and English
 * 3. Category & attribute filtering combined with search
 * 4. Route handler GET /api/products contract: query param parsing, sorting, min/max price, pagination metadata
 * 5. Arabic re-export module verification (src/lib/arabic.ts)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

// In-memory TypeScript module loader to execute production source code directly
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
    if (specifier === 'next/server') {
      return require('next/server.js');
    }
    return require(specifier);
  };

  const mod = { exports: {} };
  moduleCache[absPath] = mod.exports;
  const runner = new Function('require', 'module', 'exports', transpiled);
  runner(customRequire, mod, mod.exports);
  moduleCache[absPath] = mod.exports;
  return mod.exports;
}

// Load real production modules
const mockRepoModule = loadTsModule('./src/lib/repositories/MockCatalogRepository.ts');
const { MockCatalogRepository, wordTrigramSimilarity, calculateTrigramSimilarity } = mockRepoModule;
const repo = MockCatalogRepository.getInstance();

const routeModule = loadTsModule('./src/app/api/products/route.ts');
const { GET } = routeModule;

const arabicModule = loadTsModule('./src/lib/arabic.ts');
const { normalizeArabic } = arabicModule;

// Test results tracking
const results = {
  suite1_typo_tolerance: [],
  suite2_active_ingredient: [],
  suite3_category_filtering: [],
  suite4_route_handler_contract: [],
  suite5_arabic_reexport: [],
};

function record(suite, name, passed, error = null) {
  results[suite].push({ name, passed, error });
  const icon = passed ? '  ✔' : '  ✖';
  console.log(`${icon} [${suite.toUpperCase()}] ${name}`);
  if (!passed && error) {
    console.error('     Error details:', error);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  DAWAAK PHARMACY — ROUTE HANDLER & ADVANCED SEARCH TEST SUITE  ');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // SUITE 1: Typo Tolerance & Trigram Matching Parity
  // -------------------------------------------------------------------------
  console.log('[SUITE 1] Testing Typo Tolerance & Trigram Matching Parity...');

  try {
    // 1.1 Arabic typo: missing waw in "سينترافل" -> should match "سينترافول"
    const res = await repo.getProducts({ search: 'سينترافل' });
    assert(res.items.length > 0, 'Query "سينترافل" should return matching items');
    assert(res.items[0].nameAr.includes('سينترافول'), `Top result should be Syntraphol, got: ${res.items[0].nameAr}`);
    record('suite1_typo_tolerance', 'Arabic typo "سينترافل" matches "سينترافول"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'Arabic typo "سينترافل" matches "سينترافول"', false, err.message);
  }

  try {
    // 1.2 Arabic typo: missing yaa in "سبتودرم" -> should match "سيبتوديرم"
    const res = await repo.getProducts({ search: 'سبتودرم' });
    assert(res.items.length > 0, 'Query "سبتودرم" should return matching items');
    assert(res.items[0].nameAr.includes('سيبتوديرم') || res.items[0].slug.includes('septoderm'), `Top result should be Septoderm, got: ${res.items[0].nameAr}`);
    record('suite1_typo_tolerance', 'Arabic typo "سبتودرم" matches "سيبتوديرم"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'Arabic typo "سبتودرم" matches "سيبتوديرم"', false, err.message);
  }

  try {
    // 1.3 Arabic typo: "ايجبتوكالم" -> should match "إيجيبتوكالم"
    const res = await repo.getProducts({ search: 'ايجبتوكالم' });
    assert(res.items.length > 0, 'Query "ايجبتوكالم" should return matching items');
    assert(res.items[0].nameAr.includes('إيجيبتوكالم') || res.items[0].slug.includes('egyptocalm'), 'Should match EgyptoCalm');
    record('suite1_typo_tolerance', 'Arabic typo "ايجبتوكالم" matches "إيجيبتوكالم"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'Arabic typo "ايجبتوكالم" matches "إيجيبتوكالم"', false, err.message);
  }

  try {
    // 1.4 Arabic typo: "جاستروشلد" -> should match "جاستروشيلد"
    const res = await repo.getProducts({ search: 'جاستروشلد' });
    assert(res.items.length > 0, 'Query "جاستروشلد" should return matching items');
    assert(res.items[0].nameAr.includes('جاستروشيلد'), 'Should match GastroShield');
    record('suite1_typo_tolerance', 'Arabic typo "جاستروشلد" matches "جاستروشيلد"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'Arabic typo "جاستروشلد" matches "جاستروشيلد"', false, err.message);
  }

  try {
    // 1.5 English typo: "syntrafol" -> should match "Syntraphol"
    const res = await repo.getProducts({ search: 'syntrafol' });
    assert(res.items.length > 0, 'Query "syntrafol" should return matching items');
    assert(res.items[0].nameEn.toLowerCase().includes('syntraphol'), `Should match Syntraphol, got: ${res.items[0].nameEn}`);
    record('suite1_typo_tolerance', 'English typo "syntrafol" matches "Syntraphol"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'English typo "syntrafol" matches "Syntraphol"', false, err.message);
  }

  try {
    // 1.6 English typo: "septoderm" -> should match "Septoderm"
    const res = await repo.getProducts({ search: 'septoderm' });
    assert(res.items.length > 0, 'Query "septoderm" should return matching items');
    assert(res.items[0].nameEn.toLowerCase().includes('septoderm'), 'Should match Septoderm');
    record('suite1_typo_tolerance', 'English exact/fuzzy "septoderm" matches "Septoderm"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'English exact/fuzzy "septoderm" matches "Septoderm"', false, err.message);
  }

  try {
    // 1.7 English typo: "pharmacur" (missing e) -> should match "PharmaCure"
    const res = await repo.getProducts({ search: 'pharmacur' });
    assert(res.items.length > 0, 'Query "pharmacur" should return matching items');
    assert(res.items[0].nameEn.toLowerCase().includes('pharmacure'), 'Should match PharmaCure');
    record('suite1_typo_tolerance', 'English typo "pharmacur" matches "PharmaCure"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'English typo "pharmacur" matches "PharmaCure"', false, err.message);
  }

  try {
    // 1.8 Multi-word query with typo: "سينترافل اكسترا" -> matches "سينترافول إكسترا"
    const res = await repo.getProducts({ search: 'سينترافل اكسترا' });
    assert(res.items.length > 0, 'Query "سينترافل اكسترا" should return matching items');
    assert(res.items[0].nameAr.includes('سينترافول إكسترا'), 'Top match should be Syntraphol Extra');
    record('suite1_typo_tolerance', 'Multi-word Arabic typo "سينترافل اكسترا" matches "سينترافول إكسترا"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'Multi-word Arabic typo "سينترافل اكسترا" matches "سينترافول إكسترا"', false, err.message);
  }

  try {
    // 1.9 Multi-word query with typo: "syntrafol extra" -> matches "Syntraphol Extra"
    const res = await repo.getProducts({ search: 'syntrafol extra' });
    assert(res.items.length > 0, 'Query "syntrafol extra" should return matching items');
    assert(res.items[0].nameEn.toLowerCase().includes('syntraphol extra'), 'Top match should be Syntraphol Extra');
    record('suite1_typo_tolerance', 'Multi-word English typo "syntrafol extra" matches "Syntraphol Extra"', true);
  } catch (err) {
    record('suite1_typo_tolerance', 'Multi-word English typo "syntrafol extra" matches "Syntraphol Extra"', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Active Ingredient Search in Arabic and English
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 2] Testing Active Ingredient Search in Arabic and English...');

  try {
    // 2.1 Arabic active ingredient: "كافيين" -> matches Syntraphol Extra
    const res = await repo.getProducts({ search: 'كافيين' });
    assert(res.items.length > 0, 'Query "كافيين" should match active ingredient');
    assert(res.items.some(p => p.activeIngredientAr.includes('كافيين')), 'Should find product containing كافيين');
    record('suite2_active_ingredient', 'Arabic active ingredient "كافيين" resolves correctly', true);
  } catch (err) {
    record('suite2_active_ingredient', 'Arabic active ingredient "كافيين" resolves correctly', false, err.message);
  }

  try {
    // 2.2 Arabic active ingredient: "إيجيبتوكالم" -> matches EgyptoCalm Citrate
    const res = await repo.getProducts({ search: 'إيجيبتوكالم' });
    assert(res.items.length > 0, 'Query "إيجيبتوكالم" should match active ingredient');
    assert(res.items.some(p => p.activeIngredientAr.includes('إيجيبتوكالم')), 'Should find product containing إيجيبتوكالم');
    record('suite2_active_ingredient', 'Arabic active ingredient "إيجيبتوكالم" resolves correctly', true);
  } catch (err) {
    record('suite2_active_ingredient', 'Arabic active ingredient "إيجيبتوكالم" resolves correctly', false, err.message);
  }

  try {
    // 2.3 English active ingredient: "syncaffeine" -> matches Syntraphol Extra
    const res = await repo.getProducts({ search: 'syncaffeine' });
    assert(res.items.length > 0, 'Query "syncaffeine" should match active ingredient');
    assert(res.items.some(p => p.activeIngredientEn.toLowerCase().includes('syncaffeine')), 'Should find product with SynCaffeine');
    record('suite2_active_ingredient', 'English active ingredient "syncaffeine" resolves correctly', true);
  } catch (err) {
    record('suite2_active_ingredient', 'English active ingredient "syncaffeine" resolves correctly', false, err.message);
  }

  try {
    // 2.4 English active ingredient: "gastroshield" -> matches GastroShield-M
    const res = await repo.getProducts({ search: 'gastroshield' });
    assert(res.items.length > 0, 'Query "gastroshield" should match active ingredient');
    assert(res.items.some(p => p.activeIngredientEn.toLowerCase().includes('gastroshield')), 'Should find product with GastroShield');
    record('suite2_active_ingredient', 'English active ingredient "gastroshield" resolves correctly', true);
  } catch (err) {
    record('suite2_active_ingredient', 'English active ingredient "gastroshield" resolves correctly', false, err.message);
  }

  try {
    // 2.5 Explicit activeIngredient filter option
    const res = await repo.getProducts({ activeIngredient: 'GastroShield-M' });
    assert(res.items.length > 0, 'Explicit activeIngredient filter should return items');
    assert(res.items.every(p => p.activeIngredientEn.toLowerCase().includes('gastroshield') || p.activeIngredientAr.includes('جاستروشيلد')), 'All items must match active ingredient');
    record('suite2_active_ingredient', 'Explicit activeIngredient filter option functions properly', true);
  } catch (err) {
    record('suite2_active_ingredient', 'Explicit activeIngredient filter option functions properly', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Category Filtering Combined with Search
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 3] Testing Category Filtering Combined with Search...');

  try {
    // 3.1 Category analgesics-pain + typo search "سينترافل" -> matches Syntraphol
    const res = await repo.getProducts({ category: 'analgesics-pain', search: 'سينترافل' });
    assert(res.items.length > 0, 'Should return results for analgesics-pain + سينترافل');
    assert(res.items.every(p => p.categoryId === 'analgesics-pain'), 'All results must belong to analgesics-pain');
    record('suite3_category_filtering', 'Category "analgesics-pain" + typo "سينترافل" returns expected item', true);
  } catch (err) {
    record('suite3_category_filtering', 'Category "analgesics-pain" + typo "سينترافل" returns expected item', false, err.message);
  }

  try {
    // 3.2 Category digestive-health + search "سينترافل" -> 0 items (category fence preserved)
    const res = await repo.getProducts({ category: 'digestive-health', search: 'سينترافل' });
    assert.strictEqual(res.items.length, 0, 'Syntraphol should NOT appear under digestive-health');
    record('suite3_category_filtering', 'Category fence preserved: digestive-health + "سينترافل" yields 0 results', true);
  } catch (err) {
    record('suite3_category_filtering', 'Category fence preserved: digestive-health + "سينترافل" yields 0 results', false, err.message);
  }

  try {
    // 3.3 Category respiratory-cough + English search "pharmacur"
    const res = await repo.getProducts({ category: 'respiratory-cough', search: 'pharmacur' });
    assert(res.items.length > 0, 'Should return respiratory-cough items matching pharmacur');
    assert(res.items.every(p => p.categoryId === 'respiratory-cough'), 'All results must belong to respiratory-cough');
    record('suite3_category_filtering', 'Category "respiratory-cough" + typo "pharmacur" returns expected item', true);
  } catch (err) {
    record('suite3_category_filtering', 'Category "respiratory-cough" + typo "pharmacur" returns expected item', false, err.message);
  }

  try {
    // 3.4 Prescription filter (Rx vs OTC)
    const rxRes = await repo.getProducts({ prescription: true });
    assert(rxRes.items.length > 0, 'Should return Rx items');
    assert(rxRes.items.every(p => p.prescriptionRequired === true), 'All items must require prescription');

    const otcRes = await repo.getProducts({ prescription: false });
    assert(otcRes.items.length > 0, 'Should return OTC items');
    assert(otcRes.items.every(p => p.prescriptionRequired === false), 'All items must NOT require prescription');
    record('suite3_category_filtering', 'Prescription status filter (true / false) segregates accurately', true);
  } catch (err) {
    record('suite3_category_filtering', 'Prescription status filter (true / false) segregates accurately', false, err.message);
  }

  try {
    // 3.5 Dosage form filter: "Syrup"
    const res = await repo.getProducts({ dosageForm: 'Syrup' });
    assert(res.items.length > 0, 'Should return Syrup items');
    assert(res.items.every(p => p.dosageForm.toLowerCase() === 'syrup'), 'All items must be Syrup');
    record('suite3_category_filtering', 'Dosage form filter "Syrup" filters accurately', true);
  } catch (err) {
    record('suite3_category_filtering', 'Dosage form filter "Syrup" filters accurately', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Route Handler Full Contract Verification
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 4] Testing Route Handler Full Contract Verification (GET /api/products)...');

  try {
    // 4.1 Default GET /api/products
    const req = new Request('http://localhost:3000/api/products');
    const response = await GET(req);
    assert.strictEqual(response.status, 200, 'HTTP status should be 200');
    const json = await response.json();
    assert.strictEqual(json.success, true, 'Response success should be true');
    assert(Array.isArray(json.data), 'data should be an array');
    assert.strictEqual(json.data.length, 12, 'Default pageSize should be 12');
    assert(json.pagination.total >= 30, 'Total products should be >= 30');
    assert.strictEqual(json.pagination.page, 1, 'Default page should be 1');
    assert.strictEqual(json.pagination.pageSize, 12, 'Default pageSize should be 12');
    assert.strictEqual(json.pagination.totalPages, Math.ceil(json.pagination.total / 12), 'totalPages math accurate');
    assert.strictEqual(json.pagination.hasMore, true, 'hasMore should be true on page 1');
    record('suite4_route_handler_contract', 'Default GET /api/products returns standardized payload with pagination', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Default GET /api/products returns standardized payload with pagination', false, err.message);
  }

  try {
    // 4.2 Pagination parameters: page=2&pageSize=5
    const req = new Request('http://localhost:3000/api/products?page=2&pageSize=5');
    const response = await GET(req);
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.pagination.page, 2);
    assert.strictEqual(json.pagination.pageSize, 5);
    assert.strictEqual(json.data.length, 5);
    assert.strictEqual(json.pagination.totalPages, Math.ceil(json.pagination.total / 5));
    assert.strictEqual(json.pagination.hasMore, json.pagination.page < json.pagination.totalPages);
    record('suite4_route_handler_contract', 'Custom pagination (page=2, pageSize=5) metadata matches data slicing', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Custom pagination (page=2, pageSize=5) metadata matches data slicing', false, err.message);
  }

  try {
    // 4.3 Last page boundary: hasMore becomes false
    const req1 = new Request('http://localhost:3000/api/products?pageSize=10');
    const res1 = await GET(req1);
    const json1 = await res1.json();
    const lastPage = json1.pagination.totalPages;

    const reqLast = new Request(`http://localhost:3000/api/products?page=${lastPage}&pageSize=10`);
    const resLast = await GET(reqLast);
    const jsonLast = await resLast.json();
    assert.strictEqual(jsonLast.pagination.page, lastPage);
    assert.strictEqual(jsonLast.pagination.hasMore, false, 'hasMore must be false on final page');
    record('suite4_route_handler_contract', 'Final page boundary sets hasMore=false correctly', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Final page boundary sets hasMore=false correctly', false, err.message);
  }

  try {
    // 4.4 Min and Max price filtering via Route Handler: minPrice=40&maxPrice=90
    const req = new Request('http://localhost:3000/api/products?minPrice=40&maxPrice=90&pageSize=30');
    const response = await GET(req);
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert(json.data.length > 0, 'Should find products within 40-90 EGP range');
    for (const p of json.data) {
      const effectivePrice = p.salePriceEgp ?? p.priceEgp;
      assert(effectivePrice >= 40 && effectivePrice <= 90, `Price ${effectivePrice} outside [40, 90] bounds`);
    }
    assert.strictEqual(json.filtersApplied.minPrice, 40);
    assert.strictEqual(json.filtersApplied.maxPrice, 90);
    record('suite4_route_handler_contract', 'Price range filter (minPrice=40, maxPrice=90) strictly enforced', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Price range filter (minPrice=40, maxPrice=90) strictly enforced', false, err.message);
  }

  try {
    // 4.5 Sorting: price-asc (ascending)
    const reqAsc = new Request('http://localhost:3000/api/products?sort=price-asc&pageSize=20');
    const resAsc = await GET(reqAsc);
    const jsonAsc = await resAsc.json();
    for (let i = 0; i < jsonAsc.data.length - 1; i++) {
      const p1 = jsonAsc.data[i].salePriceEgp ?? jsonAsc.data[i].priceEgp;
      const p2 = jsonAsc.data[i + 1].salePriceEgp ?? jsonAsc.data[i + 1].priceEgp;
      assert(p1 <= p2, `Price sort ascending broken: ${p1} > ${p2}`);
    }
    record('suite4_route_handler_contract', 'Sort order "price-asc" strictly ascends', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Sort order "price-asc" strictly ascends', false, err.message);
  }

  try {
    // 4.6 Sorting: price-desc (descending)
    const reqDesc = new Request('http://localhost:3000/api/products?sort=price-desc&pageSize=20');
    const resDesc = await GET(reqDesc);
    const jsonDesc = await resDesc.json();
    for (let i = 0; i < jsonDesc.data.length - 1; i++) {
      const p1 = jsonDesc.data[i].salePriceEgp ?? jsonDesc.data[i].priceEgp;
      const p2 = jsonDesc.data[i + 1].salePriceEgp ?? jsonDesc.data[i + 1].priceEgp;
      assert(p1 >= p2, `Price sort descending broken: ${p1} < ${p2}`);
    }
    record('suite4_route_handler_contract', 'Sort order "price-desc" strictly descends', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Sort order "price-desc" strictly descends', false, err.message);
  }

  try {
    // 4.7 Sorting: rating
    const reqRating = new Request('http://localhost:3000/api/products?sort=rating&pageSize=20');
    const resRating = await GET(reqRating);
    const jsonRating = await resRating.json();
    for (let i = 0; i < jsonRating.data.length - 1; i++) {
      assert(jsonRating.data[i].rating >= jsonRating.data[i + 1].rating, 'Rating sort broken');
    }
    record('suite4_route_handler_contract', 'Sort order "rating" strictly descends by review score', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Sort order "rating" strictly descends by review score', false, err.message);
  }

  try {
    // 4.8 Combined query with filtersApplied reflection
    const reqComb = new Request('http://localhost:3000/api/products?q=فوار&category=digestive-health&prescription=false&minPrice=10&maxPrice=100&sort=price-asc');
    const resComb = await GET(reqComb);
    const jsonComb = await resComb.json();
    assert.strictEqual(jsonComb.success, true);
    assert.strictEqual(jsonComb.filtersApplied.search, 'فوار');
    assert.strictEqual(jsonComb.filtersApplied.category, 'digestive-health');
    assert.strictEqual(jsonComb.filtersApplied.prescription, false);
    assert.strictEqual(jsonComb.filtersApplied.minPrice, 10);
    assert.strictEqual(jsonComb.filtersApplied.maxPrice, 100);
    assert.strictEqual(jsonComb.filtersApplied.sort, 'price-asc');
    assert(jsonComb.data.length > 0, 'Should find EgyptoCalm Effervescent');
    record('suite4_route_handler_contract', 'Full query combination reflects correctly in filtersApplied', true);
  } catch (err) {
    record('suite4_route_handler_contract', 'Full query combination reflects correctly in filtersApplied', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Arabic Re-export Module Verification (src/lib/arabic.ts)
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 5] Testing Arabic Re-export Module Verification (src/lib/arabic.ts)...');

  try {
    assert(typeof normalizeArabic === 'function', 'normalizeArabic must be a function exported by src/lib/arabic.ts');
    assert.strictEqual(normalizeArabic('سِينْتْرَافُول'), 'سينترافول', 'De-tashkeel verified');
    assert.strictEqual(normalizeArabic('سـيـنـتـرافـول'), 'سينترافول', 'De-tatweel verified');
    assert.strictEqual(normalizeArabic('إيجيبتوكالم'), 'ايجيبتوكالم', 'Alef normalization verified');
    assert.strictEqual(normalizeArabic('سخونية'), 'سخونيه', 'Taa marbuta normalization verified');
    record('suite5_arabic_reexport', 'src/lib/arabic.ts re-exports normalizeArabic flawlessly', true);
  } catch (err) {
    record('suite5_arabic_reexport', 'src/lib/arabic.ts re-exports normalizeArabic flawlessly', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('  TEST EXECUTION SUMMARY');
  console.log('================================================================');
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const [suite, tests] of Object.entries(results)) {
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    totalTests += tests.length;
    totalPassed += passed;
    totalFailed += failed;
    console.log(`${suite.padEnd(32)} | Total: ${String(tests.length).padStart(2)} | Passed: ${String(passed).padStart(2)} | Failed: ${String(failed).padStart(2)}`);
  }

  console.log('----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
  console.log(`PASS RATE: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
