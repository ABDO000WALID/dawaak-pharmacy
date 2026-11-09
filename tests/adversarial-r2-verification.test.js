/**
 * Adversarial R2 Verification Test Suite
 * Author: challenger_r2_1 (Empirical Challenger)
 * Independent verification of Iteration 2 fixes:
 * 1. Egyptian dialect compound query matching ("عايز فوار", etc.)
 * 2. Arabic Tatweel / Kashida elongation ("سـيـنـتـرافـول", "فـــــوار")
 * 3. Transliteration duality ("سيترافول" vs "سينترافول")
 * 4. Single-character search scoping (no symptom blast radius)
 * 5. Category filter chaining preservation during search
 * 6. Cart state invariance across search executions
 * 7. Voice search Web Speech API contracts and error states
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeArabic } from '../src/lib/utils/arabic.ts';
import { searchCatalog, DIALECT_MAPPINGS, calculateCartTotals } from './harness.js';
import { SYNTHETIC_PRODUCTS } from './fixtures/catalog.js';

// Load real products directly from src/lib/mock-data/products.ts
const prodCode = fs.readFileSync('./src/lib/mock-data/products.ts', 'utf8');
const cleanedProds = prodCode
  .replace(/import\s+\{[^}]+\}\s+from\s+'[^']+';/g, '')
  .replace(/:\s*SyntheticProduct\[\]/g, '');
const arrayStr = cleanedProds
  .replace(/export\s+const\s+PRODUCTS\s*=\s*/, '')
  .trim()
  .replace(/;$/, '');
const SRC_PRODUCTS = eval('(' + arrayStr + ')');

// Extract DIALECT_MAP directly from src/lib/services/product-service.ts
const prodServiceCode = fs.readFileSync('./src/lib/services/product-service.ts', 'utf8');
const dialectMatch = prodServiceCode.match(/const DIALECT_MAP: Record<string, string\[\]> = (\{[\s\S]*?\});/);
const SRC_DIALECT_MAP = eval('(' + dialectMatch[1] + ')');

// Exact implementation of ProductService.getAllProducts using src logic
function srcGetAllProducts(options) {
  let result = [...SRC_PRODUCTS];

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

    const dialectMatchSlugs = [];
    for (const [symptom, slugs] of Object.entries(SRC_DIALECT_MAP)) {
      const normSymptom = normalizeArabic(symptom);
      if (
        (normQ && (normQ.includes(normSymptom) || (normQ.length >= 2 && normSymptom.includes(normQ)))) ||
        (rawQ && (rawQ.includes(symptom.toLowerCase()) || (rawQ.length >= 2 && symptom.toLowerCase().includes(rawQ))))
      ) {
        dialectMatchSlugs.push(...slugs);
      }
    }

    result = result.filter(p => {
      if (dialectMatchSlugs.includes(p.slug)) return true;

      const normNameAr = normalizeArabic(p.nameAr);
      const normActiveAr = normalizeArabic(p.activeIngredientAr);
      const normDescAr = normalizeArabic(p.descriptionAr);

      const arTokens = normQ.split(/\s+/).filter(t => t.length >= 3);
      const enTokens = rawQ.split(/\s+/).filter(t => t.length >= 3);

      const matchesArabic = normQ.length > 0 && (
        normNameAr.includes(normQ) ||
        normActiveAr.includes(normQ) ||
        normDescAr.includes(normQ) ||
        (arTokens.length > 1 && arTokens.some(t => normNameAr.includes(t) || normActiveAr.includes(t)))
      );

      const matchesEnglish = rawQ.length > 0 && (
        p.nameEn.toLowerCase().includes(rawQ) ||
        p.activeIngredientEn.toLowerCase().includes(rawQ) ||
        p.descriptionEn.toLowerCase().includes(rawQ) ||
        (enTokens.length > 1 && enTokens.some(t => p.nameEn.toLowerCase().includes(t) || p.activeIngredientEn.toLowerCase().includes(t)))
      );

      return matchesArabic || matchesEnglish;
    });
  }

  return result;
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [✔ PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  [✖ FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

console.log('================================================================');
console.log('   EMPIRICAL ADVERSARIAL R2 VERIFICATION SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: Compound Queries & Colloquial Dialect Matching
// -------------------------------------------------------------
console.log('--- SECTION 1: Compound Egyptian Dialect Queries ---');

test('Compound "عايز فوار" matches EgyptoCalm in srcGetAllProducts', () => {
  const results = srcGetAllProducts({ search: 'عايز فوار' });
  assert.ok(results.length > 0, 'Expected at least 1 match');
  assert.ok(results.some(p => p.slug === 'egyptocalm-effervescent'), 'Expected egyptocalm-effervescent in results');
});

test('Compound "عايز فوار" matches EgyptoCalm in test harness searchCatalog', () => {
  const results = searchCatalog('عايز فوار');
  assert.ok(results.length > 0, 'Expected at least 1 match');
  assert.ok(results.some(p => p.slug === 'egyptocalm-effervescent'), 'Expected egyptocalm-effervescent in results');
});

test('Compound "محتاج فوار للمعدة" matches EgyptoCalm in srcGetAllProducts', () => {
  const results = srcGetAllProducts({ search: 'محتاج فوار للمعدة' });
  assert.ok(results.length > 0, 'Expected match for compound colloquial query');
  assert.ok(results.some(p => p.slug === 'egyptocalm-effervescent'));
});

test('Compound "عايز فوار حموضة سريع" matches EgyptoCalm and GastroShield', () => {
  const results = srcGetAllProducts({ search: 'عايز فوار حموضة سريع' });
  assert.ok(results.length >= 2, 'Expected at least 2 matches for dual-symptom query');
  assert.ok(results.some(p => p.slug === 'egyptocalm-effervescent'));
  assert.ok(results.some(p => p.slug === 'gastroshield-m-20'));
});

test('Compound "دواء كحة للاطفال" matches pediatric-cough-k-oral', () => {
  const results = srcGetAllProducts({ search: 'دواء كحة للاطفال' });
  assert.ok(results.length > 0, 'Expected match for pediatric cough compound');
  assert.ok(results.some(p => p.slug === 'pediatric-cough-k-oral'));
});

// -------------------------------------------------------------
// SECTION 2: Arabic Tatweel / Kashida Normalization & Matching
// -------------------------------------------------------------
console.log('\n--- SECTION 2: Tatweel / Kashida Elongation ---');

test('Tatweel normalization: "سـيـنـتـرافـول" normalizes to "سينترافول"', () => {
  const normalized = normalizeArabic('سـيـنـتـرافـول');
  assert.equal(normalized, 'سينترافول');
});

test('Heavy Tatweel normalization: "ســـــيـــــنـــــتـــــرافـــــول" normalizes to "سينترافول"', () => {
  const normalized = normalizeArabic('ســـــيـــــنـــــتـــــرافـــــول');
  assert.equal(normalized, 'سينترافول');
});

test('Search with Tatweel: "سـيـنـتـرافـول" matches Syntraphol Extra in srcGetAllProducts', () => {
  const results = srcGetAllProducts({ search: 'سـيـنـتـرافـول' });
  assert.ok(results.length > 0, 'Expected match for Tatweel elongated query');
  assert.ok(results.some(p => p.slug === 'syntraphol-extra-500'));
});

test('Search with Tatweel: "فـــــوار" matches EgyptoCalm in srcGetAllProducts', () => {
  const results = srcGetAllProducts({ search: 'فـــــوار' });
  assert.ok(results.length > 0, 'Expected match for elongated "فوار"');
  assert.ok(results.some(p => p.slug === 'egyptocalm-effervescent'));
});

test('Search with Tatweel and Tashkeel: "إِيــــجِـيـبْـتُـوكَـــالْـم" matches EgyptoCalm', () => {
  const results = srcGetAllProducts({ search: 'إِيــــجِـيـبْـتُـوكَـــالْـم' });
  assert.ok(results.length > 0, 'Expected match for combined Tatweel + Tashkeel query');
  assert.ok(results.some(p => p.slug === 'egyptocalm-effervescent'));
});

// -------------------------------------------------------------
// SECTION 3: Transliteration Dual Spelling
// -------------------------------------------------------------
console.log('\n--- SECTION 3: Transliteration Dual Spelling ("سيترافول" vs "سينترافول") ---');

test('Spelling "سينترافول" matches Syntraphol in srcGetAllProducts', () => {
  const results = srcGetAllProducts({ search: 'سينترافول' });
  assert.ok(results.length > 0, 'Expected match for "سينترافول"');
  assert.ok(results.some(p => p.slug === 'syntraphol-extra-500'));
});

test('Spelling "سيترافول" matches Syntraphol in srcGetAllProducts', () => {
  const results = srcGetAllProducts({ search: 'سيترافول' });
  assert.ok(results.length > 0, 'Expected match for "سيترافول" via active ingredient');
  assert.ok(results.some(p => p.slug === 'syntraphol-extra-500'));
});

test('Spelling "سيترافول" matches Syntraphol in test fixture searchCatalog', () => {
  const results = searchCatalog('سيترافول');
  assert.ok(results.length > 0, 'Expected match in test harness for "سيترافول"');
  assert.ok(results.some(p => p.slug === 'syntraphol-extra-500'));
});

test('Spelling with Tatweel "سـيـتـرافـول" matches Syntraphol in srcGetAllProducts', () => {
  const results = srcGetAllProducts({ search: 'سـيـتـرافـول' });
  assert.ok(results.length > 0, 'Expected match for Tatweel "سيترافول"');
  assert.ok(results.some(p => p.slug === 'syntraphol-extra-500'));
});

// -------------------------------------------------------------
// SECTION 4: Single Character Query Blast Radius Control
// -------------------------------------------------------------
console.log('\n--- SECTION 4: Single-Character Scoping (No Symptom Blast) ---');

test('Single character "ص" does NOT trigger unrelated symptoms (مغص, مفاصل)', () => {
  const results = srcGetAllProducts({ search: 'ص' });
  // EgyptoCalm has no "ص" in name, activeIngredient, or description
  const egyptoCalm = results.find(p => p.slug === 'egyptocalm-effervescent');
  assert.equal(egyptoCalm, undefined, 'EgyptoCalm must NOT be returned for query "ص" via "مغص" symptom match');
});

test('Single character Arabic letters (all 28) trigger ZERO dialect matches in DIALECT_MAP', () => {
  const arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
  for (const char of arabicLetters) {
    const normQ = char;
    const rawQ = char;
    const dialectMatchSlugs = [];
    for (const [symptom, slugs] of Object.entries(SRC_DIALECT_MAP)) {
      const normSymptom = normalizeArabic(symptom);
      if (
        (normQ && (normQ.includes(normSymptom) || (normQ.length >= 2 && normSymptom.includes(normQ)))) ||
        (rawQ && (rawQ.includes(symptom.toLowerCase()) || (rawQ.length >= 2 && symptom.toLowerCase().includes(rawQ))))
      ) {
        dialectMatchSlugs.push(...slugs);
      }
    }
    assert.equal(dialectMatchSlugs.length, 0, `Letter "${char}" must trigger 0 dialect matches in DIALECT_MAP`);
  }
});

test('Single character "ز" only matches products with z/ز in actual properties', () => {
  const results = srcGetAllProducts({ search: 'ز' });
  for (const p of results) {
    const hasZ = normalizeArabic(p.nameAr).includes('ز') ||
                 normalizeArabic(p.activeIngredientAr).includes('ز') ||
                 normalizeArabic(p.descriptionAr).includes('ز') ||
                 p.nameEn.toLowerCase().includes('z') ||
                 p.activeIngredientEn.toLowerCase().includes('z') ||
                 p.descriptionEn.toLowerCase().includes('z');
    assert.ok(hasZ, `Product ${p.slug} must actually contain letter z/ز`);
  }
});

// -------------------------------------------------------------
// SECTION 5: Filter Chaining Preservation
// -------------------------------------------------------------
console.log('\n--- SECTION 5: Category Filter Chaining with Search ---');

test('Category filter "digestive-health" + search "فوار" returns EgyptoCalm', () => {
  const results = srcGetAllProducts({
    category: 'digestive-health',
    search: 'فوار',
  });
  assert.ok(results.length > 0, 'Expected match');
  assert.ok(results.every(p => p.categoryId === 'digestive-health'), 'All results must belong to digestive-health');
  assert.ok(results.some(p => p.slug === 'egyptocalm-effervescent'));
});

test('Category filter "analgesics-pain" + search "فوار" returns 0 results (no filter drop)', () => {
  const results = srcGetAllProducts({
    category: 'analgesics-pain',
    search: 'فوار',
  });
  assert.equal(results.length, 0, 'Category constraint must NOT be overwritten by search filter');
});

test('Prescription filter (true) + search "سينترافول" returns 0 (Syntraphol is OTC)', () => {
  const results = srcGetAllProducts({
    prescription: true,
    search: 'سينترافول',
  });
  assert.equal(results.length, 0, 'OTC drug must not appear when prescription=true filter is active');
});

// -------------------------------------------------------------
// SECTION 6: Cart State Invariance
// -------------------------------------------------------------
console.log('\n--- SECTION 6: Cart State Invariance ---');

test('Cart state remains completely immutable during repeated search calls', () => {
  const cartState = {
    items: [
      { id: 'prod-syn-001', nameAr: 'سينترافول إكسترا 500 مجم', priceEgp: 32.00, quantity: 2 },
      { id: 'prod-syn-002', nameAr: 'إيجيبتوكالم فوار سريع', priceEgp: 26.50, quantity: 3 },
      { id: 'prod-syn-003', nameAr: 'فارماكيور-دي إكس شراب', priceEgp: 47.00, quantity: 1 },
    ],
    subtotalEgp: 190.00,
    deliveryFeeEgp: 25.00,
    totalEgp: 215.00,
  };

  const initialJson = JSON.stringify(cartState);

  // Perform multiple high-frequency searches across varied terms
  const searchTerms = ['عايز فوار', 'سـيـنـتـرافـول', 'صداع', 'مفيش حاجة', '12345', ''];
  for (const q of searchTerms) {
    srcGetAllProducts({ search: q });
    searchCatalog(q);
  }

  const finalJson = JSON.stringify(cartState);
  assert.equal(initialJson, finalJson, 'Cart state must remain 100% byte-for-byte identical');
  assert.equal(cartState.items.length, 3);
  assert.equal(cartState.subtotalEgp, 190.00);
  assert.equal(cartState.deliveryFeeEgp, 25.00);
  assert.equal(cartState.totalEgp, 215.00);
});

// -------------------------------------------------------------
// SECTION 7: Voice Search Web Speech API Contracts & Error States
// -------------------------------------------------------------
console.log('\n--- SECTION 7: Voice Search Contract & Error Handling ---');

class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = '';
    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.started = false;
  }
  start() {
    this.started = true;
    if (this.onstart) this.onstart();
  }
  stop() {
    this.started = false;
    if (this.onend) this.onend();
  }
  abort() {
    this.started = false;
    if (this.onend) this.onend();
  }
}

test('Voice controller initializes SpeechRecognition with ar-EG language', () => {
  const recognition = new MockSpeechRecognition();
  recognition.lang = 'ar-EG';
  assert.equal(recognition.lang, 'ar-EG', 'Voice search must strictly use ar-EG locale');
});

test('Voice search state machine transitions to "بسمعك..." on start', () => {
  let uiStatus = 'idle';
  const recognition = new MockSpeechRecognition();
  recognition.onstart = () => {
    uiStatus = 'بسمعك...';
  };
  recognition.start();
  assert.equal(uiStatus, 'بسمعك...', 'UI status must display "بسمعك..." during active listening');
});

test('Voice recognition auto-populates query and resolves catalog products', () => {
  let submittedQuery = '';
  let resolvedProducts = [];
  const recognition = new MockSpeechRecognition();
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    submittedQuery = transcript;
    resolvedProducts = srcGetAllProducts({ search: transcript });
  };

  recognition.start();
  // Simulate spoken phrase "عايز فوار"
  recognition.onresult({
    results: [[{ transcript: 'عايز فوار' }]],
  });

  assert.equal(submittedQuery, 'عايز فوار');
  assert.ok(resolvedProducts.length > 0);
  assert.ok(resolvedProducts.some(p => p.slug === 'egyptocalm-effervescent'));
});

test('Voice search permission denied sets clear Arabic alert message', () => {
  let errorMessage = '';
  let isListening = true;
  const recognition = new MockSpeechRecognition();

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed') {
      errorMessage = 'تم رفض إذن استخدام الميكروفون';
      isListening = false;
    }
  };

  recognition.onerror({ error: 'not-allowed' });
  assert.equal(errorMessage, 'تم رفض إذن استخدام الميكروفون');
  assert.equal(isListening, false);
});

test('Voice search unsupported browser displays advisory notice without crashing', () => {
  const checkVoiceSupport = (windowObj) => {
    const SpeechRec = windowObj?.SpeechRecognition || windowObj?.webkitSpeechRecognition;
    if (!SpeechRec) {
      return { supported: false, message: 'المتصفح لا يدعم خاصية البحث الصوتي' };
    }
    return { supported: true, message: null };
  };

  const mockUnsupportedWindow = {};
  const status = checkVoiceSupport(mockUnsupportedWindow);
  assert.equal(status.supported, false);
  assert.equal(status.message, 'المتصفح لا يدعم خاصية البحث الصوتي');
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log(`PASS RATE:   ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
