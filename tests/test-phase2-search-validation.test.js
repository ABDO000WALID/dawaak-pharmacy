/**
 * Phase 2 Closure Verification Suite (R1):
 * 1. Authoritative 20-Case Search Matrix (5 categories x 4 cases: إملائي, تشكيل, كشيدة, عامية, إنجليزي)
 *    verified across MockCatalogRepository, ProductService.getAllProducts, and GET /api/products.
 * 2. DIALECT_MAP integrity check (zero phantom slugs across 36-product catalog).
 * 3. GET /api/products local response latency benchmark (< 150ms across 8 operational scenarios).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
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
      const target = path.resolve('./src', specifier.slice(2));
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

const mockRepoModule = loadTsModule('./src/lib/repositories/MockCatalogRepository.ts');
const productServiceModule = loadTsModule('./src/lib/services/product-service.ts');
const productsDataModule = loadTsModule('./src/lib/mock-data/products.ts');
const routeModule = loadTsModule('./src/app/api/products/route.ts');

const repo = mockRepoModule.MockCatalogRepository.getInstance();
const repoDialectMap = mockRepoModule.DIALECT_MAP;
const { ProductService, DIALECT_MAP: serviceDialectMap } = productServiceModule;
const { PRODUCTS } = productsDataModule;
const { GET } = routeModule;

const AUTHORITATIVE_20_CASES = [
  // 1. إملائي (Spelling Typos)
  { id: 'TC-EMLA-01', category: 'إملائي', query: 'سينترافل', expectedSlug: 'syntraphol-extra-500' },
  { id: 'TC-EMLA-02', category: 'إملائي', query: 'سبتودرم', expectedSlug: 'septoderm-antiseptic-spray' },
  { id: 'TC-EMLA-03', category: 'إملائي', query: 'ايجبتوكالم', expectedSlug: 'egyptocalm-effervescent' },
  { id: 'TC-EMLA-04', category: 'إملائي', query: 'جاستروشلد', expectedSlug: 'gastroshield-m-20' },

  // 2. تشكيل (Tashkeel Diacritics)
  { id: 'TC-TASH-01', category: 'تشكيل', query: 'سِينْتْرَافُولْ إِكْسْتْرَا', expectedSlug: 'syntraphol-extra-500' },
  { id: 'TC-TASH-02', category: 'تشكيل', query: 'فَارْمَاكِيُور-دِي إِكْس شَرَابٌ', expectedSlug: 'pharmacure-dx-syrup' },
  { id: 'TC-TASH-03', category: 'تشكيل', query: 'إِيجِيبْتُوكَالْم فَوَّارٌ', expectedSlug: 'egyptocalm-effervescent' },
  { id: 'TC-TASH-04', category: 'تشكيل', query: 'سِينْتْرَافُولاً', expectedSlug: 'syntraphol-extra-500' },

  // 3. كشيدة (Tatweel Elongation)
  { id: 'TC-KASH-01', category: 'كشيدة', query: 'سـيـنـتـرافـول إكـسـتـرا', expectedSlug: 'syntraphol-extra-500' },
  { id: 'TC-KASH-02', category: 'كشيدة', query: 'فَـــــوَّار هـــــاضـم', expectedSlug: 'egyptocalm-effervescent' },
  { id: 'TC-KASH-03', category: 'كشيدة', query: 'جـاسـتـروشـيـلـد', expectedSlug: 'gastroshield-m-20' },
  { id: 'TC-KASH-04', category: 'كشيدة', query: 'كـارديـوكـيـر-إكـس', expectedSlug: 'cardiocare-x-10' },

  // 4. عامية (Egyptian Dialect)
  { id: 'TC-DIAL-01', category: 'عامية', query: 'سخونية', expectedSlug: 'syntraphol-extra-500' },
  { id: 'TC-DIAL-02', category: 'عامية', query: 'عايز فوار للحموضة', expectedSlug: 'egyptocalm-effervescent' },
  { id: 'TC-DIAL-03', category: 'عامية', query: 'مغص وبطني وجعاني', expectedSlug: 'egyptocalm-effervescent' },
  { id: 'TC-DIAL-04', category: 'عامية', query: 'وجع مفاصل', expectedSlug: 'osteojoint-synth-extra' },

  // 5. إنجليزي (English Typos)
  { id: 'TC-ENGL-01', category: 'إنجليزي', query: 'syntrafol', expectedSlug: 'syntraphol-extra-500' },
  { id: 'TC-ENGL-02', category: 'إنجليزي', query: 'pharmacur', expectedSlug: 'pharmacure-dx-syrup' },
  { id: 'TC-ENGL-03', category: 'إنجليزي', query: 'egiptocalm', expectedSlug: 'egyptocalm-effervescent' },
  { id: 'TC-ENGL-04', category: 'إنجليزي', query: 'gastroshild', expectedSlug: 'gastroshield-m-20' },
];

const EXACT_NAME_CASES = [
  { id: 'TC-EXACT-01', category: 'اسم صحيح', query: 'سينترافول إكسترا', expectedSlug: 'syntraphol-extra-500' },
  { id: 'TC-EXACT-02', category: 'اسم صحيح', query: 'فارماكيور-دي إكس', expectedSlug: 'pharmacure-dx-syrup' },
  { id: 'TC-EXACT-03', category: 'اسم صحيح', query: 'إيجيبتوكالم فوار', expectedSlug: 'egyptocalm-effervescent' },
  { id: 'TC-EXACT-04', category: 'اسم صحيح', query: 'جاستروشيلد', expectedSlug: 'gastroshield-m-20' },
  { id: 'TC-EXACT-05', category: 'اسم صحيح', query: 'Syntraphol Extra', expectedSlug: 'syntraphol-extra-500' },
  { id: 'TC-EXACT-06', category: 'اسم صحيح', query: 'سيبتوديرم مطهر', expectedSlug: 'septoderm-antiseptic-spray' },
];

const NEGATIVE_SEARCH_CASES = [
  { id: 'TC-NEG-01', category: 'عشوائي', query: 'zzzzxxxxqqqq' },
  { id: 'TC-NEG-02', category: 'خضروات', query: 'طماطم وبطاطس وخيار' },
  { id: 'TC-NEG-03', category: 'سيارات', query: 'قطع غيار سيارات تويوتا' },
  { id: 'TC-NEG-04', category: 'سياحة', query: 'رحلات شرم الشيخ والغردقة' },
  { id: 'TC-NEG-05', category: 'أرقام', query: '1234567890987654321' },
  { id: 'TC-NEG-06', category: 'أجهزة', query: 'تكييف شارب انفرتر' },
  { id: 'TC-NEG-07', category: 'عقارات', query: 'عقارات وشقق للبيع بالتقسيط' },
  { id: 'TC-NEG-08', category: 'اقتصاد', query: 'اسعار الذهب والدولار اليوم' },
  { id: 'TC-NEG-09', category: 'كمبيوتر', query: 'لابتوب ديل مستعمل للبيع' },
  { id: 'TC-NEG-10', category: 'ملابس', query: 'فستان سهرة حريمي تركي' },
];

const LATENCY_SCENARIOS = [
  { name: 'Default catalog listing', url: 'http://localhost:3000/api/products' },
  { name: 'Exact Arabic commercial name', url: 'http://localhost:3000/api/products?q=سينترافول' },
  { name: 'Arabic typo trigram match', url: 'http://localhost:3000/api/products?q=سينترافل' },
  { name: 'Full Tashkeel diacritics', url: 'http://localhost:3000/api/products?q=سِينْتْرَافُولْ' },
  { name: 'Tatweel / Kashida elongation', url: 'http://localhost:3000/api/products?q=سـيـنـتـرافـول' },
  { name: 'Egyptian dialect compound query', url: 'http://localhost:3000/api/products?q=عايز فوار للحموضة' },
  { name: 'English typo fuzzy search', url: 'http://localhost:3000/api/products?q=syntrafol' },
  {
    name: 'Combined query + filters + sort + pagination',
    url: 'http://localhost:3000/api/products?q=فوار&category=digestive-health&minPrice=10&maxPrice=100&sort=price-asc&page=1&pageSize=12',
  },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function recordResult(label, passed, detail = '') {
  totalTests += 1;
  if (passed) {
    passedTests += 1;
    console.log(`  ✔ PASS: ${label}${detail ? ` (${detail})` : ''}`);
  } else {
    failedTests += 1;
    console.error(`  ✖ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function benchmarkScenario(url, iterations = 100) {
  for (let i = 0; i < 5; i++) {
    const res = await GET(new Request(url));
    await res.json();
  }

  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const res = await GET(new Request(url));
    const json = await res.json();
    const elapsed = performance.now() - start;
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    samples.push(elapsed);
  }

  samples.sort((a, b) => a - b);
  const avg = samples.reduce((sum, v) => sum + v, 0) / samples.length;
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const max = samples[samples.length - 1];
  return { min: samples[0], avg, p95, max };
}

async function run() {
  console.log('================================================================');
  console.log('  DAWAAK PHARMACY — PHASE 2 CLOSURE SEARCH & LATENCY SUITE      ');
  console.log('================================================================\n');

  console.log('[SUITE 1] 20-Case Search Matrix (5 Categories x 4 Cases, Asserting Top-3)...');
  for (const tc of AUTHORITATIVE_20_CASES) {
    try {
      const repoRes = await repo.getProducts({ search: tc.query, pageSize: 36 });
      const syncRes = ProductService.getAllProducts({ search: tc.query });
      const apiRes = await GET(new Request(`http://localhost:3000/api/products?q=${encodeURIComponent(tc.query)}&pageSize=36`));
      const apiJson = await apiRes.json();

      const repoIdx = repoRes.items.findIndex((p) => p.slug === tc.expectedSlug || p.slug.startsWith(tc.expectedSlug));
      const syncIdx = syncRes.findIndex((p) => p.slug === tc.expectedSlug || p.slug.startsWith(tc.expectedSlug));
      const apiIdx = Array.isArray(apiJson.data) ? apiJson.data.findIndex((p) => p.slug === tc.expectedSlug || p.slug.startsWith(tc.expectedSlug)) : -2;

      const repoRank = repoIdx === -1 ? 999 : repoIdx + 1;
      const syncRank = syncIdx === -1 ? 999 : syncIdx + 1;
      const apiRank = apiIdx === -1 ? 999 : apiIdx + 1;

      assert(repoRank >= 1 && repoRank <= 3, `MockCatalogRepository rank (${repoRank}) not in Top-3 for ${tc.expectedSlug}`);
      assert(syncRank >= 1 && syncRank <= 3, `ProductService rank (${syncRank}) not in Top-3 for ${tc.expectedSlug}`);
      assert(apiRank >= 1 && apiRank <= 3, `GET /api/products rank (${apiRank}) not in Top-3 for ${tc.expectedSlug}`);

      recordResult(
        `[${tc.id}] [${tc.category}] "${tc.query}" -> ${tc.expectedSlug} (Rank: repo=${repoRank}, sync=${syncRank}, api=${apiRank})`,
        true,
        `criteria=Top-3, topHit=${repoRes.items[0]?.slug}`
      );
    } catch (err) {
      recordResult(`[${tc.id}] [${tc.category}] "${tc.query}" -> ${tc.expectedSlug}`, false, err.message);
    }
  }

  console.log('\n[SUITE 1B] Exact Commercial Name Search (Asserting Strictly Top-1)...');
  for (const tc of EXACT_NAME_CASES) {
    try {
      const repoRes = await repo.getProducts({ search: tc.query, pageSize: 36 });
      const syncRes = ProductService.getAllProducts({ search: tc.query });
      const apiRes = await GET(new Request(`http://localhost:3000/api/products?q=${encodeURIComponent(tc.query)}&pageSize=36`));
      const apiJson = await apiRes.json();

      const repoIdx = repoRes.items.findIndex((p) => p.slug === tc.expectedSlug || p.slug.startsWith(tc.expectedSlug));
      const syncIdx = syncRes.findIndex((p) => p.slug === tc.expectedSlug || p.slug.startsWith(tc.expectedSlug));
      const apiIdx = Array.isArray(apiJson.data) ? apiJson.data.findIndex((p) => p.slug === tc.expectedSlug || p.slug.startsWith(tc.expectedSlug)) : -2;

      const repoRank = repoIdx === -1 ? 999 : repoIdx + 1;
      const syncRank = syncIdx === -1 ? 999 : syncIdx + 1;
      const apiRank = apiIdx === -1 ? 999 : apiIdx + 1;

      assert.equal(repoRank, 1, `MockCatalogRepository rank (${repoRank}) is not strictly Top-1 for exact query "${tc.query}"`);
      assert.equal(syncRank, 1, `ProductService rank (${syncRank}) is not strictly Top-1 for exact query "${tc.query}"`);
      assert.equal(apiRank, 1, `GET /api/products rank (${apiRank}) is not strictly Top-1 for exact query "${tc.query}"`);

      recordResult(
        `[${tc.id}] [${tc.category}] "${tc.query}" -> ${tc.expectedSlug} (Rank: 1)`,
        true,
        `criteria=Top-1, topHit=${repoRes.items[0]?.slug}`
      );
    } catch (err) {
      recordResult(`[${tc.id}] [${tc.category}] "${tc.query}" -> ${tc.expectedSlug}`, false, err.message);
    }
  }

  console.log('\n[SUITE 1C] Negative Out-of-Catalog Search Cases (Asserting 0 Results / "مفيش نتائج")...');
  for (const nc of NEGATIVE_SEARCH_CASES) {
    try {
      const repoRes = await repo.getProducts({ search: nc.query, pageSize: 36 });
      const syncRes = ProductService.getAllProducts({ search: nc.query });
      const apiRes = await GET(new Request(`http://localhost:3000/api/products?q=${encodeURIComponent(nc.query)}&pageSize=36`));
      const apiJson = await apiRes.json();

      assert.equal(repoRes.items.length, 0, `MockCatalogRepository returned ${repoRes.items.length} items for "${nc.query}"`);
      assert.equal(syncRes.length, 0, `ProductService returned ${syncRes.length} items for "${nc.query}"`);
      assert(Array.isArray(apiJson.data) && apiJson.data.length === 0, `GET /api/products returned ${apiJson.data?.length} items for "${nc.query}"`);

      recordResult(
        `[${nc.id}] [${nc.category}] "${nc.query}" -> 0 results ("مفيش نتائج")`,
        true,
        `repo=0, sync=0, api=0`
      );
    } catch (err) {
      recordResult(`[${nc.id}] [${nc.category}] "${nc.query}" -> 0 results`, false, err.message);
    }
  }

  console.log('\n[SUITE 2] DIALECT_MAP Catalog Slug Integrity...');
  try {
    const validSlugs = new Set(PRODUCTS.map((p) => p.slug));
    const missingInRepo = [];
    const missingInService = [];

    for (const [key, slugs] of Object.entries(repoDialectMap)) {
      for (const slug of slugs) {
        if (!validSlugs.has(slug)) missingInRepo.push(`${key}:${slug}`);
      }
    }
    for (const [key, slugs] of Object.entries(serviceDialectMap)) {
      for (const slug of slugs) {
        if (!validSlugs.has(slug)) missingInService.push(`${key}:${slug}`);
      }
    }

    assert.equal(missingInRepo.length, 0, `Phantom slugs in MockCatalogRepository DIALECT_MAP: ${missingInRepo.join(', ')}`);
    assert.equal(missingInService.length, 0, `Phantom slugs in ProductService DIALECT_MAP: ${missingInService.join(', ')}`);

    const acneRepo = await repo.getProducts({ search: 'حب شباب' });
    const acneSync = ProductService.getAllProducts({ search: 'حب شباب' });
    assert(acneRepo.items.some((p) => p.slug === 'dermoheal-plus-gel'), 'Expected dermoheal-plus-gel for "حب شباب" in repo');
    assert(acneSync.some((p) => p.slug === 'dermoheal-plus-gel'), 'Expected dermoheal-plus-gel for "حب شباب" in sync');

    recordResult('DIALECT_MAP has 0 phantom slugs and resolves "حب شباب" cleanly', true);
  } catch (err) {
    recordResult('DIALECT_MAP has 0 phantom slugs and resolves "حب شباب" cleanly', false, err.message);
  }

  console.log('\n[SUITE 3] GET /api/products Local Latency Benchmark (< 150ms)...');
  try {
    const scenarioStats = [];
    for (const scenario of LATENCY_SCENARIOS) {
      const stats = await benchmarkScenario(scenario.url, 100);
      scenarioStats.push({ ...scenario, ...stats });
      console.log(
        `    - ${scenario.name}: min=${stats.min.toFixed(2)}ms avg=${stats.avg.toFixed(2)}ms p95=${stats.p95.toFixed(2)}ms max=${stats.max.toFixed(2)}ms`
      );
      assert(stats.p95 < 150, `${scenario.name} p95 (${stats.p95.toFixed(2)}ms) exceeded 150ms`);
      assert(stats.max < 150, `${scenario.name} max (${stats.max.toFixed(2)}ms) exceeded 150ms`);
    }
    const worstMax = Math.max(...scenarioStats.map((s) => s.max));
    recordResult('All 8 GET /api/products scenarios execute < 150ms locally', true, `max=${worstMax.toFixed(2)}ms`);
  } catch (err) {
    recordResult('All 8 GET /api/products scenarios execute < 150ms locally', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log(`PASS RATE: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error in Phase 2 search validation suite:', err);
  process.exit(1);
});
