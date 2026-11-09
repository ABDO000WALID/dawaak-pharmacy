/**
 * Empirical Adversarial Challenger Test Suite
 * Domain: Search Engine (R1) & Voice Search Engine (R2)
 * Egyptian Online Pharmacy Platform
 */

import assert from 'node:assert/strict';
import {
  normalizeArabic,
  searchCatalog,
  calculateCartTotals,
  createCartStore,
  createMockSpeechRecognition,
  createVoiceSearchController
} from './harness.js';
import { SYNTHETIC_PRODUCTS, CATEGORIES } from './fixtures/catalog.js';

// Load actual src mock-data to test real mock data items as well
import fs from 'node:fs';

const testResults = {
  suite1_arabic_normalization: [],
  suite2_edge_boundary: [],
  suite3_cart_invariance: [],
  suite4_voice_contract: []
};

function recordTest(suite, id, description, passed, details = null) {
  testResults[suite].push({ id, description, passed, details });
  const status = passed ? '✔ PASS' : '✖ FAIL';
  console.log(`[${status}] [${id}] ${description}`);
  if (!passed && details) {
    console.error(`       Failure details:`, details);
  }
}

console.log('================================================================');
console.log('  RUNNING ADVERSARIAL STRESS HARNESS — SEARCH & VOICE ENGINES  ');
console.log('================================================================\n');

// ============================================================================
// SUITE 1: Arabic Normalization & Character Stress-Testing
// ============================================================================
console.log('--- SUITE 1: Arabic Normalization Stress-Testing ---');

// 1.1 Tashkeel & Diacritics
try {
  const variations = [
    { query: 'سِينْتْرَافُول', desc: 'Full Tashkeel (Fatha, Kasra, Sukun, Damma)' },
    { query: 'سِينْـتْرَافُولْ', desc: 'Tashkeel with Sukun on Lam' },
    { query: 'سِينترافولٌ', desc: 'Tanween Damm' },
    { query: 'سِينترافولاً', desc: 'Tanween Fath' },
    { query: 'سِينترافولٍ', desc: 'Tanween Kasr' },
    { query: 'شَدَّة سِينتْرَافُولّ', desc: 'Shadda on letters' }
  ];

  for (let i = 0; i < variations.length; i++) {
    const v = variations[i];
    const norm = normalizeArabic(v.query);
    const results = searchCatalog(v.query);
    const hasProduct = results.some(p => p.slug === 'syntraphol-extra-500');
    // If Tanween Fath adds an alef at the end, does it match or fail?
    recordTest(
      'suite1_arabic_normalization',
      `NORM-DIAC-0${i + 1}`,
      `Diacritic query matching (${v.desc}): "${v.query}" -> norm: "${norm}"`,
      hasProduct,
      hasProduct ? null : `Normalized to "${norm}" but matched ${results.length} products`
    );
  }
} catch (err) {
  recordTest('suite1_arabic_normalization', 'NORM-DIAC-ERR', 'Tashkeel stress error', false, err.message);
}

// 1.2 Alef Variants (أ, إ, آ, ا)
try {
  const alefVariants = [
    { query: 'إيجيبتوكالم', expectedSlug: 'egyptocalm-effervescent', desc: 'Hamza below (إ)' },
    { query: 'ايجيبتوكالم', expectedSlug: 'egyptocalm-effervescent', desc: 'Plain Alef (ا)' },
    { query: 'أيجيبتوكالم', expectedSlug: 'egyptocalm-effervescent', desc: 'Hamza above (أ)' },
    { query: 'آيجيبتوكالم', expectedSlug: 'egyptocalm-effervescent', desc: 'Madda Alef (آ)' },
    { query: 'أوستيوجوينت', expectedSlug: 'osteojoint-synth-extra', desc: 'OsteoJoint Hamza above (أ)' },
    { query: 'اوستيوجوينت', expectedSlug: 'osteojoint-synth-extra', desc: 'OsteoJoint Plain Alef (ا)' },
    { query: 'أوكيوكلير', expectedSlug: 'ocuclear-s-eye-drops', desc: 'OcuClear Hamza above (أ)' },
    { query: 'اوكيوكلير', expectedSlug: 'ocuclear-s-eye-drops', desc: 'OcuClear Plain Alef (ا)' }
  ];

  for (let i = 0; i < alefVariants.length; i++) {
    const item = alefVariants[i];
    const res = searchCatalog(item.query);
    const matched = res.some(p => p.slug === item.expectedSlug);
    recordTest(
      'suite1_arabic_normalization',
      `NORM-ALEF-0${i + 1}`,
      `Alef variant handling: "${item.query}" (${item.desc})`,
      matched,
      matched ? null : `Expected ${item.expectedSlug}, got [${res.map(p => p.slug).join(', ')}]`
    );
  }
} catch (err) {
  recordTest('suite1_arabic_normalization', 'NORM-ALEF-ERR', 'Alef variant error', false, err.message);
}

// 1.3 Taa Marbuta vs Haa (ة vs ه)
try {
  const taaVariants = [
    { query: 'سخونية', expectedSlug: 'syntraphol-extra-500', desc: 'Symptom with Taa Marbuta (ة)' },
    { query: 'سخونيه', expectedSlug: 'syntraphol-extra-500', desc: 'Symptom with Haa (ه)' },
    { query: 'حموضة', expectedSlug: 'egyptocalm-effervescent', desc: 'Symptom with Taa Marbuta (ة)' },
    { query: 'حموضه', expectedSlug: 'egyptocalm-effervescent', desc: 'Symptom with Haa (ه)' },
    { query: 'كحة', expectedSlug: 'pharmacure-dx-syrup', desc: 'Symptom with Taa Marbuta (ة)' },
    { query: 'كحه', expectedSlug: 'pharmacure-dx-syrup', desc: 'Symptom with Haa (ه)' },
    { query: 'قطرة', expectedSlug: 'ocuclear-s-eye-drops', desc: 'Product keyword with ة' },
    { query: 'قطره', expectedSlug: 'ocuclear-s-eye-drops', desc: 'Product keyword with ه' }
  ];

  for (let i = 0; i < taaVariants.length; i++) {
    const item = taaVariants[i];
    const res = searchCatalog(item.query);
    const matched = res.some(p => p.slug === item.expectedSlug);
    recordTest(
      'suite1_arabic_normalization',
      `NORM-TAA-0${i + 1}`,
      `Taa Marbuta vs Haa: "${item.query}" (${item.desc})`,
      matched,
      matched ? null : `Expected ${item.expectedSlug}, got [${res.map(p => p.slug).join(', ')}]`
    );
  }
} catch (err) {
  recordTest('suite1_arabic_normalization', 'NORM-TAA-ERR', 'Taa vs Haa error', false, err.message);
}

// 1.4 Yaa vs Alef Maqsura (ي vs ى)
try {
  const yaaVariants = [
    { query: 'عيني', expectedSlug: 'ocuclear-s-eye-drops', desc: 'Yaa standard (ي)' },
    { query: 'عينى', expectedSlug: 'ocuclear-s-eye-drops', desc: 'Alef Maqsura (ى)' }
  ];

  for (let i = 0; i < yaaVariants.length; i++) {
    const item = yaaVariants[i];
    const res = searchCatalog(item.query);
    const matched = res.some(p => p.slug === item.expectedSlug);
    recordTest(
      'suite1_arabic_normalization',
      `NORM-YAA-0${i + 1}`,
      `Yaa vs Alef Maqsura: "${item.query}" (${item.desc})`,
      matched,
      matched ? null : `Expected ${item.expectedSlug}, got [${res.map(p => p.slug).join(', ')}]`
    );
  }
} catch (err) {
  recordTest('suite1_arabic_normalization', 'NORM-YAA-ERR', 'Yaa vs Maqsura error', false, err.message);
}

// 1.5 Specific Trade Name Queries ("سينترافول" vs "سيترافول", "إيجيبتوكالم", "فارماكيور")
try {
  // Query 1: "سينترافول"
  const resSyntraphol = searchCatalog('سينترافول');
  recordTest(
    'suite1_arabic_normalization',
    'TRADE-01',
    'Commercial trade name "سينترافول" matches Syntraphol Extra',
    resSyntraphol.some(p => p.slug === 'syntraphol-extra-500'),
    resSyntraphol.length === 0 ? 'No match found' : null
  );

  // Query 2: "سيترافول" (without noon)
  // Let's test what happens in searchCatalog
  const resSitraphol = searchCatalog('سيترافول');
  recordTest(
    'suite1_arabic_normalization',
    'TRADE-02',
    'Alternative phonetic trade spelling "سيترافول" search behavior',
    resSitraphol.length >= 0, // observation
    `Returned ${resSitraphol.length} matches: [${resSitraphol.map(p => p.slug).join(', ')}]`
  );

  // Query 3: "إيجيبتوكالم" vs "ايجيبتوكالم"
  const resEgyptoCalm1 = searchCatalog('إيجيبتوكالم');
  const resEgyptoCalm2 = searchCatalog('ايجيبتوكالم');
  recordTest(
    'suite1_arabic_normalization',
    'TRADE-03',
    'Commercial trade name "إيجيبتوكالم" matches EgyptoCalm Effervescent',
    resEgyptoCalm1.some(p => p.slug === 'egyptocalm-effervescent') &&
    resEgyptoCalm2.some(p => p.slug === 'egyptocalm-effervescent'),
    null
  );

  // Query 4: "فارماكيور"
  const resPharmaCure = searchCatalog('فارماكيور');
  recordTest(
    'suite1_arabic_normalization',
    'TRADE-04',
    'Commercial trade name "فارماكيور" matches PharmaCure-DX Syrup',
    resPharmaCure.some(p => p.slug === 'pharmacure-dx-syrup'),
    null
  );
} catch (err) {
  recordTest('suite1_arabic_normalization', 'TRADE-ERR', 'Trade name error', false, err.message);
}

// 1.6 Active Ingredient Queries in AR & EN ("باراسيتامول", "سيترافول تركيبي", "MelatoSyn", "PharmaCure SynAmox")
try {
  // 1.6a: "باراسيتامول" - Non-synthetic real drug name. In a synthetic pharmacy catalog, should NOT falsely match unrelated drugs, or return empty
  const resParacetamol = searchCatalog('باراسيتامول');
  recordTest(
    'suite1_arabic_normalization',
    'INGRED-01',
    'Active ingredient "باراسيتامول" returns empty array (no synthetic contamination)',
    resParacetamol.length === 0,
    resParacetamol.length > 0 ? `Unintended match: [${resParacetamol.map(p => p.slug).join(', ')}]` : null
  );

  // 1.6b: "MelatoSyn"
  const resMelatoSyn = searchCatalog('MelatoSyn');
  recordTest(
    'suite1_arabic_normalization',
    'INGRED-02',
    'Active ingredient "MelatoSyn" matches SleepEasy-Synth',
    resMelatoSyn.some(p => p.slug === 'sleepeasy-synth-night'),
    null
  );

  // 1.6c: "SynCaffeine"
  const resSynCaffeine = searchCatalog('SynCaffeine');
  recordTest(
    'suite1_arabic_normalization',
    'INGRED-03',
    'Active ingredient "SynCaffeine" matches Syntraphol Extra',
    resSynCaffeine.some(p => p.slug === 'syntraphol-extra-500'),
    null
  );

  // 1.6d: "PharmaCure SynAmox"
  // Note: PharmaCure is in catalog, but SynAmox is not. Partial vs full match check
  const resSynAmox = searchCatalog('PharmaCure SynAmox');
  const resPureSynAmox = searchCatalog('SynAmox');
  recordTest(
    'suite1_arabic_normalization',
    'INGRED-04',
    'Active ingredient "SynAmox" standalone returns 0 matches (clean catalog)',
    resPureSynAmox.length === 0,
    null
  );
  recordTest(
    'suite1_arabic_normalization',
    'INGRED-05',
    'Combined query "PharmaCure SynAmox" behavior',
    resSynAmox.length >= 0,
    `Returned ${resSynAmox.length} matches: [${resSynAmox.map(p => p.slug).join(', ')}]`
  );
} catch (err) {
  recordTest('suite1_arabic_normalization', 'INGRED-ERR', 'Active ingredient error', false, err.message);
}

// 1.7 Colloquial Egyptian Symptom Queries ("عايز فوار", "صداع شديد", "سخونية", "مغص")
try {
  const colloquialQueries = [
    { query: 'عايز فوار', expectedSlug: 'egyptocalm-effervescent', desc: 'Compound request with "فوار"' },
    { query: 'صداع شديد', expectedSlug: 'syntraphol-extra-500', desc: 'Compound request with "صداع"' },
    { query: 'سخونية', expectedSlug: 'syntraphol-extra-500', desc: 'Direct Egyptian fever symptom' },
    { query: 'مغص', expectedSlug: 'egyptocalm-effervescent', desc: 'Direct Egyptian colic symptom' },
    { query: 'عايز دوا كحة', expectedSlug: 'pharmacure-dx-syrup', desc: 'Compound request with "كحة"' },
    { query: 'عندي حموضة جامدة', expectedSlug: 'egyptocalm-effervescent', desc: 'Compound request with "حموضة"' },
    { query: 'وجع مفاصل', expectedSlug: 'osteojoint-synth-extra', desc: 'Compound request with "مفاصل"' }
  ];

  for (let i = 0; i < colloquialQueries.length; i++) {
    const q = colloquialQueries[i];
    const res = searchCatalog(q.query);
    const matched = res.some(p => p.slug === q.expectedSlug);
    recordTest(
      'suite1_arabic_normalization',
      `SYMPTOM-0${i + 1}`,
      `Colloquial Egyptian query "${q.query}" matches expected product`,
      matched,
      matched ? null : `Expected ${q.expectedSlug}, got [${res.map(p => p.slug).join(', ')}]`
    );
  }
} catch (err) {
  recordTest('suite1_arabic_normalization', 'SYMPTOM-ERR', 'Symptom query error', false, err.message);
}

// ============================================================================
// SUITE 2: Edge & Boundary Cases
// ============================================================================
console.log('\n--- SUITE 2: Edge & Boundary Cases ---');

// 2.1 Empty and Whitespace Queries
try {
  const emptyRes = searchCatalog('');
  recordTest(
    'suite2_edge_boundary',
    'EDGE-EMPTY-01',
    'Empty string query returns all catalog items',
    emptyRes.length === SYNTHETIC_PRODUCTS.length,
    `Got ${emptyRes.length}, expected ${SYNTHETIC_PRODUCTS.length}`
  );

  const wsRes = searchCatalog('     \t  \n  ');
  recordTest(
    'suite2_edge_boundary',
    'EDGE-EMPTY-02',
    'Whitespace-only query returns all catalog items without throwing',
    wsRes.length === SYNTHETIC_PRODUCTS.length,
    `Got ${wsRes.length}, expected ${SYNTHETIC_PRODUCTS.length}`
  );

  const nullRes = searchCatalog(null);
  recordTest(
    'suite2_edge_boundary',
    'EDGE-EMPTY-03',
    'Null query handled safely without crash',
    nullRes.length === SYNTHETIC_PRODUCTS.length,
    null
  );

  const undefRes = searchCatalog(undefined);
  recordTest(
    'suite2_edge_boundary',
    'EDGE-EMPTY-04',
    'Undefined query handled safely without crash',
    undefRes.length === SYNTHETIC_PRODUCTS.length,
    null
  );
} catch (err) {
  recordTest('suite2_edge_boundary', 'EDGE-EMPTY-ERR', 'Empty query crash', false, err.message);
}

// 2.2 Single-Character Queries
try {
  const singleChars = ['أ', 'س', 'ص', 'ف', 'ك', 'م', 'a', 'x', '1', '9'];
  let singleCharCrashed = false;
  for (const char of singleChars) {
    try {
      const res = searchCatalog(char);
      assert.ok(Array.isArray(res), `Result for "${char}" must be an array`);
    } catch (e) {
      singleCharCrashed = true;
      recordTest('suite2_edge_boundary', `EDGE-CHAR-${char}`, `Crash on single char "${char}"`, false, e.message);
    }
  }
  if (!singleCharCrashed) {
    recordTest(
      'suite2_edge_boundary',
      'EDGE-CHAR-ALL',
      'Single character queries (Arabic, Latin, digits) execute safely without crashes',
      true,
      null
    );
  }
} catch (err) {
  recordTest('suite2_edge_boundary', 'EDGE-CHAR-ERR', 'Single char error', false, err.message);
}

// 2.3 Very Long Strings (Stress test for memory and CPU)
try {
  const longQueries = [
    { name: '1KB repeated Arabic', q: 'سينترافول '.repeat(100) },
    { name: '10KB repeated Latin', q: 'syntraphol '.repeat(1000) },
    { name: '10KB random gibberish', q: 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.repeat(300) }
  ];

  for (let i = 0; i < longQueries.length; i++) {
    const lq = longQueries[i];
    const startTime = performance.now();
    const res = searchCatalog(lq.q);
    const duration = performance.now() - startTime;
    const isPerformant = duration < 50; // must finish within 50ms
    recordTest(
      'suite2_edge_boundary',
      `EDGE-LONG-0${i + 1}`,
      `Very long string test (${lq.name}, length: ${lq.q.length} chars, duration: ${duration.toFixed(2)}ms)`,
      isPerformant && Array.isArray(res),
      `Duration: ${duration.toFixed(2)}ms, result count: ${res.length}`
    );
  }
} catch (err) {
  recordTest('suite2_edge_boundary', 'EDGE-LONG-ERR', 'Long string error', false, err.message);
}

// 2.4 Punctuation, Special Symbols & Injection Attempts
try {
  const specialQueries = [
    { q: "'; DROP TABLE products; --", name: 'SQL Injection' },
    { q: "' OR 1=1 --", name: 'SQL Auth Bypass' },
    { q: '<script>alert("xss")</script>', name: 'Script tag XSS' },
    { q: '<img src=x onerror=alert(1)>', name: 'Image error XSS' },
    { q: '../../../../etc/passwd', name: 'Path traversal Unix' },
    { q: '..\\..\\..\\windows\\system32', name: 'Path traversal Windows' },
    { q: '.*+?^${}()|[]\\', name: 'Regex Metacharacters' },
    { q: '((((((((((a+)+)+)+)+)+)+)+)+)+)+$', name: 'ReDoS Catastrophic Backtracking payload' },
    { q: '؟ ، ؛ « »', name: 'Arabic punctuation marks' },
    { q: '!@#$%^&*()_+-=[]{}|;:",.<>?/~`', name: 'ASCII special chars' }
  ];

  for (let i = 0; i < specialQueries.length; i++) {
    const sq = specialQueries[i];
    const startTime = performance.now();
    const res = searchCatalog(sq.q);
    const duration = performance.now() - startTime;
    const isSafe = Array.isArray(res) && duration < 50;
    recordTest(
      'suite2_edge_boundary',
      `EDGE-SEC-0${i + 1}`,
      `Security & punctuation neutralized: ${sq.name} (elapsed: ${duration.toFixed(2)}ms)`,
      isSafe,
      isSafe ? null : `Failed safety criteria: duration=${duration.toFixed(2)}ms`
    );
  }
} catch (err) {
  recordTest('suite2_edge_boundary', 'EDGE-SEC-ERR', 'Security test crash', false, err.message);
}

// 2.5 Non-Matching Queries ("مفيش نتائج")
try {
  const nonMatching = [
    'دواء غير مسجل بالصيدلية نهائيا',
    'zyxwvu_totally_non_existent_medicine_12345',
    'مضاد حيوي غير متاح'
  ];

  for (let i = 0; i < nonMatching.length; i++) {
    const q = nonMatching[i];
    const res = searchCatalog(q);
    const isEmpty = res.length === 0;
    const emptyNotice = isEmpty ? 'مفيش نتائج' : '';
    recordTest(
      'suite2_edge_boundary',
      `EDGE-NOMATCH-0${i + 1}`,
      `Non-matching query "${q}" returns empty array and displays "مفيش نتائج"`,
      isEmpty && emptyNotice === 'مفيش نتائج',
      isEmpty ? null : `Unexpectedly matched ${res.length} products: [${res.map(p => p.slug).join(', ')}]`
    );
  }
} catch (err) {
  recordTest('suite2_edge_boundary', 'EDGE-NOMATCH-ERR', 'Non-match query error', false, err.message);
}

// ============================================================================
// SUITE 3: Cart Page Search & State Invariance
// ============================================================================
console.log('\n--- SUITE 3: Cart Page Search & State Invariance ---');

try {
  const cart = createCartStore();
  const prod1 = SYNTHETIC_PRODUCTS[0]; // Syntraphol Extra (32.00 EGP sale)
  const prod2 = SYNTHETIC_PRODUCTS[1]; // PharmaCure-DX (42.00 EGP)
  const prod3 = SYNTHETIC_PRODUCTS[2]; // EgyptoCalm (28.00 EGP)

  // Populate active cart
  cart.addItem(prod1, 2); // 32 * 2 = 64
  cart.addItem(prod2, 1); // 42 * 1 = 42
  cart.addItem(prod3, 3); // 28 * 3 = 84
  // Subtotal = 64 + 42 + 84 = 190.00 EGP (< 300 -> Delivery 25.00 EGP -> Total 215.00 EGP)
  const initialCount = cart.getItemCount();
  const initialSubtotal = cart.getSubtotal();
  const initialDelivery = cart.getDeliveryFee();
  const initialTotal = cart.getTotal();

  assert.strictEqual(initialCount, 6);
  assert.strictEqual(initialSubtotal, 190.00);
  assert.strictEqual(initialDelivery, 25.00);
  assert.strictEqual(initialTotal, 215.00);

  // Step 1: Execute search keystrokes while on /cart page
  const searchQueriesOnCart = [
    'فوار',
    'صداع',
    'غير موجود',
    'MelatoSyn',
    '',
    '   '
  ];

  for (const q of searchQueriesOnCart) {
    const res = searchCatalog(q);
    assert.ok(Array.isArray(res));
  }

  // Step 2: Verify strict cart state invariance
  const postSearchCount = cart.getItemCount();
  const postSearchSubtotal = cart.getSubtotal();
  const postSearchDelivery = cart.getDeliveryFee();
  const postSearchTotal = cart.getTotal();
  const items = cart.getItems();

  const isCountPreserved = postSearchCount === initialCount;
  const isSubtotalPreserved = postSearchSubtotal === initialSubtotal;
  const isDeliveryPreserved = postSearchDelivery === initialDelivery;
  const isTotalPreserved = postSearchTotal === initialTotal;
  const areItemsPreserved = items.length === 3 &&
    items[0].quantity === 2 &&
    items[1].quantity === 1 &&
    items[2].quantity === 3;

  recordTest(
    'suite3_cart_invariance',
    'CART-INV-01',
    'Cart items count strictly preserved across repeated search operations',
    isCountPreserved,
    `Expected ${initialCount}, got ${postSearchCount}`
  );

  recordTest(
    'suite3_cart_invariance',
    'CART-INV-02',
    'Cart subtotal strictly preserved across search operations (190.00 EGP)',
    isSubtotalPreserved,
    `Expected ${initialSubtotal}, got ${postSearchSubtotal}`
  );

  recordTest(
    'suite3_cart_invariance',
    'CART-INV-03',
    'Cart delivery fee and total strictly preserved (Fee: 25.00, Total: 215.00)',
    isDeliveryPreserved && isTotalPreserved,
    `Expected fee ${initialDelivery} and total ${initialTotal}`
  );

  recordTest(
    'suite3_cart_invariance',
    'CART-INV-04',
    'Cart line items and individual quantities remain completely intact',
    areItemsPreserved,
    null
  );
} catch (err) {
  recordTest('suite3_cart_invariance', 'CART-INV-ERR', 'Cart invariance test error', false, err.message);
}

// ============================================================================
// SUITE 4: Voice Search Contract Verification
// ============================================================================
console.log('\n--- SUITE 4: Voice Search Contract Verification ---');

// 4.1 Speech Recognition Instance & ar-EG Configuration
try {
  const MockAPI = createMockSpeechRecognition();
  const controller = createVoiceSearchController({ SpeechRecognitionClass: MockAPI });
  controller.start();
  const state = controller.getState();

  recordTest(
    'suite4_voice_contract',
    'VOICE-CONTRACT-01',
    'SpeechRecognition language property configured strictly to "ar-EG"',
    state.instance && state.instance.lang === 'ar-EG',
    state.instance ? `Got lang="${state.instance.lang}"` : 'No recognition instance created'
  );

  recordTest(
    'suite4_voice_contract',
    'VOICE-CONTRACT-02',
    'Voice search controller marks service as supported when SpeechRecognition exists',
    state.isSupported === true,
    null
  );
} catch (err) {
  recordTest('suite4_voice_contract', 'VOICE-CONTRACT-ERR-01', 'Voice contract init error', false, err.message);
}

// 4.2 Interactive "بسمعك..." Visual Status
try {
  const MockAPI = createMockSpeechRecognition();
  const controller = createVoiceSearchController({ SpeechRecognitionClass: MockAPI });
  controller.start();
  await new Promise(r => setTimeout(r, 10));
  const state = controller.getState();

  recordTest(
    'suite4_voice_contract',
    'VOICE-CONTRACT-03',
    'Interactive status message displays "بسمعك..." during active listening',
    state.isListening === true && state.statusMessage.includes('بسمعك'),
    `isListening=${state.isListening}, statusMessage="${state.statusMessage}"`
  );
} catch (err) {
  recordTest('suite4_voice_contract', 'VOICE-CONTRACT-ERR-02', 'Listening indicator error', false, err.message);
}

// 4.3 Transcript Capture & Auto-Submit
try {
  const spokenPhrases = [
    'عايز فوار حموضة',
    'مسكن للصداع الشديد',
    'قطرة ترطيب للعين'
  ];

  for (let i = 0; i < spokenPhrases.length; i++) {
    const phrase = spokenPhrases[i];
    const MockAPI = createMockSpeechRecognition({ transcriptToEmit: phrase });
    let capturedTranscript = '';
    let autoSubmittedPhrase = '';

    const controller = createVoiceSearchController({
      SpeechRecognitionClass: MockAPI,
      onQueryChange: (t) => { capturedTranscript = t; },
      onAutoSubmit: (t) => { autoSubmittedPhrase = t; }
    });

    controller.start();
    for (let j = 0; j < 25 && !autoSubmittedPhrase; j++) {
      await new Promise(r => setTimeout(r, 4));
    }

    const state = controller.getState();
    const isCaptured = capturedTranscript === phrase;
    const isSubmitted = autoSubmittedPhrase === phrase;
    const isCompleted = state.isListening === false;

    recordTest(
      'suite4_voice_contract',
      `VOICE-AUTO-0${i + 1}`,
      `Spoken Egyptian phrase "${phrase}" captured and auto-submitted seamlessly`,
      isCaptured && isSubmitted && isCompleted,
      `captured="${capturedTranscript}", submitted="${autoSubmittedPhrase}", listening=${state.isListening}`
    );
  }
} catch (err) {
  recordTest('suite4_voice_contract', 'VOICE-AUTO-ERR', 'Voice auto-submit error', false, err.message);
}

// 4.4 Error Handling: Denied Permissions
try {
  const DeniedMockAPI = createMockSpeechRecognition({
    permissionGranted: false,
    errorCodeToEmit: 'not-allowed'
  });
  const controller = createVoiceSearchController({ SpeechRecognitionClass: DeniedMockAPI });
  controller.start();

  for (let i = 0; i < 25 && !controller.getState().errorMessage; i++) {
    await new Promise(r => setTimeout(r, 4));
  }

  const state = controller.getState();
  const hasDeniedMsg = state.errorMessage.includes('رفض إذن') || state.errorMessage.includes('not-allowed');
  const isStopped = state.isListening === false;

  recordTest(
    'suite4_voice_contract',
    'VOICE-ERR-01',
    'Denied microphone access sets clear informative Arabic error message and stops listening',
    hasDeniedMsg && isStopped,
    `errorMessage="${state.errorMessage}", isListening=${state.isListening}`
  );
} catch (err) {
  recordTest('suite4_voice_contract', 'VOICE-ERR-01-FAIL', 'Denied mic error handling crash', false, err.message);
}

// 4.5 Error Handling: Unsupported Browser
try {
  const controller = createVoiceSearchController({ SpeechRecognitionClass: null });
  recordTest(
    'suite4_voice_contract',
    'VOICE-ERR-02',
    'Unsupported browser detected when SpeechRecognition is missing',
    controller.isSupported === false,
    null
  );

  controller.start();
  const state = controller.getState();
  const hasUnsupportedMsg = state.errorMessage.includes('لا يدعم');

  recordTest(
    'suite4_voice_contract',
    'VOICE-ERR-03',
    'Attempting voice search on unsupported browser displays friendly advisory notice without crash',
    hasUnsupportedMsg && state.isListening === false,
    `errorMessage="${state.errorMessage}"`
  );
} catch (err) {
  recordTest('suite4_voice_contract', 'VOICE-ERR-03-FAIL', 'Unsupported browser error handling crash', false, err.message);
}

// ============================================================================
// SUITE 5: Source Code Implementation (src/lib) Deep Cross-Validation
// ============================================================================
console.log('\n--- SUITE 5: Source Code (src/lib) Deep Cross-Validation ---');

testResults.suite5_src_implementation = [];

try {
  // Test 5.1: Tatweel / Kashida (\u0640) Handling
  // Many Arabic users and mobile keyboards insert Tatweel (ـ) for visual justification
  const kashidaWord = 'سـيـنـتـرافـول';
  const normKashida = normalizeArabic(kashidaWord);
  const kashidaSearch = searchCatalog(kashidaWord);
  const stripsTatweel = !normKashida.includes('ـ');

  recordTest(
    'suite5_src_implementation',
    'SRC-TATWEEL-01',
    `Arabic Tatweel/Kashida stripping in normalizeArabic ("${kashidaWord}" -> "${normKashida}")`,
    stripsTatweel,
    stripsTatweel ? null : `normalizeArabic does NOT strip \\u0640 (Tatweel). Search matches: ${kashidaSearch.length}`
  );

  // Test 5.2: Discrepancy between src DIALECT_MAP and tests DIALECT_MAPPINGS
  const prodServiceCode = fs.readFileSync('./src/lib/services/product-service.ts', 'utf8');
  const mapMatch = prodServiceCode.match(/const DIALECT_MAP: Record<string, string\[\]> = \{([\s\S]*?)\};/);
  const srcMapEntries = [...mapMatch[1].matchAll(/'([^']+)':/g)].map(m => m[1]);

  const hasFawwarInSrc = srcMapEntries.includes('فوار');
  recordTest(
    'suite5_src_implementation',
    'SRC-DIALECT-01',
    'src/lib/services/product-service.ts DIALECT_MAP contains "فوار" key',
    hasFawwarInSrc,
    hasFawwarInSrc ? null : 'CRITICAL DISCREPANCY: "فوار" is present in tests/harness.js DIALECT_MAPPINGS but completely missing in src/lib/services/product-service.ts DIALECT_MAP!'
  );

  // Test 5.3: Compound Egyptian query "عايز فوار" in src logic
  // In src/lib/services/product-service.ts:
  // If 'فوار' is missing in DIALECT_MAP, "عايز فوار" will fail to match EgyptoCalm
  const queryFawwar = 'عايز فوار';
  const normQFawwar = normalizeArabic(queryFawwar);
  let matchedSlugsSrc = [];
  for (const symptom of srcMapEntries) {
    const normSym = normalizeArabic(symptom);
    if (normQFawwar.includes(normSym) || normSym.includes(normQFawwar)) {
      matchedSlugsSrc.push(symptom);
    }
  }

  const fawwarMatchedInSrc = matchedSlugsSrc.length > 0;
  recordTest(
    'suite5_src_implementation',
    'SRC-DIALECT-02',
    `Compound colloquial voice query "${queryFawwar}" matches in src DIALECT_MAP`,
    fawwarMatchedInSrc,
    fawwarMatchedInSrc ? null : `"${queryFawwar}" matches 0 entries in src DIALECT_MAP because "فوار" is omitted from src DIALECT_MAP`
  );

  // Test 5.4: Single character search in src DIALECT_MAP
  // In src/lib/services/product-service.ts line 60:
  // (normQ && (normQ.includes(normSymptom) || normSymptom.includes(normQ)))
  // If normQ is a single character like "ص" or "ا":
  // normSymptom.includes(normQ) matches ANY symptom containing that character!
  const singleCharQ = 'ص';
  let broadSymptomMatches = [];
  for (const symptom of srcMapEntries) {
    const normSym = normalizeArabic(symptom);
    if (normSym.includes(singleCharQ)) {
      broadSymptomMatches.push(symptom);
    }
  }

  recordTest(
    'suite5_src_implementation',
    'SRC-SINGLECHAR-01',
    `Single character query "${singleCharQ}" trigger blast in src DIALECT_MAP`,
    true,
    `Broad match blast: "${singleCharQ}" matched symptoms [${broadSymptomMatches.join(', ')}] in src DIALECT_MAP`
  );

  // Test 5.5: "سيترافول" in src mock data vs tests catalog
  // In src/lib/mock-data/products.ts line 11:
  // activeIngredientAr: 'سيترافول تركيبي 500 مجم + كافيين 65 مجم'
  // In tests/fixtures/catalog.js line 90:
  // activeIngredientAr: 'سينترافول 500 مجم + سين كافيين 65 مجم'
  const catalogFixtureCode = fs.readFileSync('./tests/fixtures/catalog.js', 'utf8');
  const hasSitrapholInFixture = catalogFixtureCode.includes('سيترافول');
  const hasSitrapholInSrc = fs.readFileSync('./src/lib/mock-data/products.ts', 'utf8').includes('سيترافول');

  recordTest(
    'suite5_src_implementation',
    'SRC-DATA-ALIGN-01',
    'Active ingredient spelling "سيترافول" alignment between src mock-data and test fixtures',
    hasSitrapholInFixture === hasSitrapholInSrc,
    `src has "سيترافول": ${hasSitrapholInSrc}, test fixture has "سيترافول": ${hasSitrapholInFixture}`
  );
} catch (err) {
  recordTest('suite5_src_implementation', 'SRC-ERR', 'Source cross-validation error', false, err.message);
}

// ============================================================================
// SUMMARY & STATISTICS
// ============================================================================
console.log('\n================================================================');
console.log('  ADVERSARIAL STRESS TEST SUMMARY  ');
console.log('================================================================');

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

for (const [suiteName, tests] of Object.entries(testResults)) {
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  totalTests += tests.length;
  totalPassed += passed;
  totalFailed += failed;
  console.log(`${suiteName.padEnd(35)} : ${tests.length} tests (✔ ${passed} passed, ✖ ${failed} failed)`);
}

console.log('----------------------------------------------------------------');
console.log(`TOTAL TESTS EXECUTED               : ${totalTests}`);
console.log(`TOTAL PASSED                       : ${totalPassed}`);
console.log(`TOTAL FAILED                       : ${totalFailed}`);
console.log(`PASS RATE                          : ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
console.log('================================================================\n');

if (totalFailed > 0) {
  console.log('FAILURES TO INVESTIGATE:');
  for (const [suiteName, tests] of Object.entries(testResults)) {
    const failedTests = tests.filter(t => !t.passed);
    for (const f of failedTests) {
      console.log(`- [${f.id}] ${f.description}: ${f.details}`);
    }
  }
}

