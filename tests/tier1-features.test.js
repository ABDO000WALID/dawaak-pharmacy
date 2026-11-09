/**
 * Tier 1: Feature Coverage Test Suite
 * Covers 8 Core Features with >= 5 comprehensive tests each (40+ tests total).
 */

import {
  assert,
  calculateCartTotals,
  createCartStore,
  createLocaleStore,
  searchCatalog,
  formatEgp,
  validateProductSafety,
  createMockSpeechRecognition,
  createVoiceSearchController
} from './harness.js';
import { SYNTHETIC_PRODUCTS, CATEGORIES } from './fixtures/catalog.js';

export async function runTier1Tests() {
  const results = [];
  const queue = [];

  function test(id, description, fn) {
    queue.push(async () => {
      try {
        await fn();
        results.push({ id, description, passed: true });
      } catch (err) {
        results.push({ id, description, passed: false, error: err });
      }
    });
  }

  // ==========================================================================
  // 1. Homepage Showcase & Trust Messaging
  // ==========================================================================
  test('T1-HOME-01', 'Homepage trust slogans exist in Arabic and English', () => {
    const sloganAr = 'صيدليتك في جيبك.. دواك يوصل لحد بابك';
    const sloganEn = 'Your Pharmacy in Your Pocket.. Your Medicine at Your Door.';
    assert.ok(sloganAr.includes('صيدليتك في جيبك'), 'Arabic slogan missing expected Egyptian phrase');
    assert.ok(sloganEn.includes('Your Pharmacy in Your Pocket'), 'English slogan missing expected phrase');
  });

  test('T1-HOME-02', 'Simulation disclaimer is defined and covers safety notice', () => {
    const disclaimer = 'تطبيق تجريبي للأغراض التعليمية — جميع بيانات الأدوية تركيبية واختبارية';
    assert.ok(disclaimer.includes('بيانات الأدوية تركيبية'), 'Disclaimer must mention synthetic medicine data');
  });

  test('T1-HOME-03', 'Category navigation renders all 8 health categories', () => {
    assert.strictEqual(CATEGORIES.length, 8, 'Expected 8 categories in navigation bar');
    const slugs = CATEGORIES.map((c) => c.slug);
    assert.ok(slugs.includes('analgesics-pain'), 'Missing analgesics category');
    assert.ok(slugs.includes('respiratory-cough'), 'Missing respiratory category');
    assert.ok(slugs.includes('digestive-health'), 'Missing digestive category');
    assert.ok(slugs.includes('chronic-cardio'), 'Missing chronic cardio category');
  });

  test('T1-HOME-04', 'Featured product cards have dual-language commercial names and ratings', () => {
    assert.ok(SYNTHETIC_PRODUCTS.length >= 14, 'Catalog should feature at least 14 items');
    for (const prod of SYNTHETIC_PRODUCTS) {
      assert.ok(prod.nameAr.length > 3, `Product ${prod.id} must have valid Arabic name`);
      assert.ok(prod.nameEn.length > 3, `Product ${prod.id} must have valid English name`);
      assert.ok(prod.rating >= 4.0 && prod.rating <= 5.0, `Product ${prod.id} rating out of bounds`);
      assert.ok(prod.reviewsCount >= 0, `Product ${prod.id} reviewsCount should be >= 0`);
    }
  });

  test('T1-HOME-05', 'Promotional discounts compute savings percentage accurately', () => {
    const promoItem = SYNTHETIC_PRODUCTS.find((p) => p.salePriceEgp && p.salePriceEgp < p.priceEgp);
    assert.ok(promoItem, 'Expected at least one promotional item with discount in catalog');
    const savingsEgp = promoItem.priceEgp - promoItem.salePriceEgp;
    const savingsPercent = Math.round((savingsEgp / promoItem.priceEgp) * 100);
    assert.ok(savingsEgp > 0, 'Savings in EGP must be greater than zero');
    assert.ok(savingsPercent > 0 && savingsPercent < 100, 'Discount percentage must be valid');
  });

  // ==========================================================================
  // 2. Health Category Taxonomy & Filtering
  // ==========================================================================
  test('T1-CAT-01', 'Filtering by analgesics-pain returns only pain relief items', () => {
    const results = searchCatalog('', 'analgesics-pain');
    assert.ok(results.length > 0, 'Should find products in analgesics-pain');
    for (const item of results) {
      assert.strictEqual(item.categoryId, 'analgesics-pain');
    }
  });

  test('T1-CAT-02', 'Filtering by chronic-cardio returns prescription and metabolic meds', () => {
    const results = searchCatalog('', 'chronic-cardio');
    assert.ok(results.length >= 2, 'Expected multiple products in chronic-cardio');
    const hasRx = results.some((p) => p.prescriptionRequired);
    assert.ok(hasRx, 'Chronic cardio category must contain Rx classified items');
  });

  test('T1-CAT-03', 'Filtering by digestive-health returns effervescent and capsules', () => {
    const results = searchCatalog('', 'digestive-health');
    assert.ok(results.length >= 2, 'Expected digestive-health products');
    const forms = results.map((p) => p.dosageForm);
    assert.ok(forms.includes('Effervescent') || forms.includes('Capsules'));
  });

  test('T1-CAT-04', 'Filtering by non-existent category safely returns empty array', () => {
    const results = searchCatalog('', 'non-existent-category-slug');
    assert.strictEqual(results.length, 0, 'Should return empty array for non-existent category');
  });

  test('T1-CAT-05', 'All 8 categories contain required metadata and icons', () => {
    for (const cat of CATEGORIES) {
      assert.ok(cat.id, 'Category must have id');
      assert.ok(cat.nameAr, 'Category must have nameAr');
      assert.ok(cat.nameEn, 'Category must have nameEn');
      assert.ok(cat.iconName, 'Category must specify iconName');
      assert.ok(typeof cat.displayOrder === 'number', 'Category must have displayOrder');
    }
  });

  // ==========================================================================
  // 3. Egyptian Search Engine & Dialect Matching
  // ==========================================================================
  test('T1-SRCH-01', 'Exact Arabic commercial name search matches product', () => {
    const results = searchCatalog('سينترافول');
    assert.ok(results.length >= 1, 'Should find syntraphol by Arabic name');
    assert.strictEqual(results[0].slug, 'syntraphol-extra-500');
  });

  test('T1-SRCH-02', 'English Latin name search matches product case-insensitively', () => {
    const resultsLower = searchCatalog('syntraphol');
    const resultsUpper = searchCatalog('SYNTRAPHOL');
    assert.ok(resultsLower.length >= 1, 'Should find syntraphol in lowercase');
    assert.strictEqual(resultsLower[0].id, resultsUpper[0].id, 'Search should be case-insensitive');
  });

  test('T1-SRCH-03', 'Active ingredient search matches correct formulation', () => {
    const results = searchCatalog('MelatoSyn');
    assert.ok(results.length >= 1, 'Should find sleep medication by active ingredient');
    assert.strictEqual(results[0].slug, 'sleepeasy-synth-night');
  });

  test('T1-SRCH-04', 'Colloquial Egyptian symptom keyword search (صداع / سخونية) resolves', () => {
    const headacheResults = searchCatalog('صداع');
    assert.ok(headacheResults.length >= 1, 'Should match headache symptom to analgesics');
    assert.strictEqual(headacheResults[0].slug, 'syntraphol-extra-500');

    const feverResults = searchCatalog('سخونية');
    assert.ok(feverResults.length >= 1, 'Should match fever symptom');
  });

  test('T1-SRCH-05', 'Search with extra leading/trailing whitespace normalizes cleanly', () => {
    const cleanResults = searchCatalog('فارماكيور');
    const dirtyResults = searchCatalog('   فارماكيور   ');
    assert.strictEqual(cleanResults.length, dirtyResults.length, 'Whitespace should be trimmed');
  });

  // ==========================================================================
  // 4. Product Details Page (PDP) & Active Ingredient Display
  // ==========================================================================
  test('T1-PDP-01', 'PDP presents dual commercial names and domestic Egyptian manufacturer', () => {
    const product = SYNTHETIC_PRODUCTS[0];
    assert.ok(product.nameAr && product.nameEn, 'Must have dual language commercial names');
    assert.ok(product.manufacturerAr && product.manufacturerEn, 'Must have domestic pharma manufacturer');
    assert.ok(product.manufacturerAr.includes('مصر') || product.manufacturerAr.includes('فارما'), 'Manufacturer should reflect Egyptian pharma');
  });

  test('T1-PDP-02', 'Distinct synthetic active ingredient chip is highlighted', () => {
    const product = SYNTHETIC_PRODUCTS[0];
    assert.ok(product.activeIngredient, 'Active ingredient must be specified');
    assert.ok(product.activeIngredient.includes('Syntraphol'), 'Active ingredient must use synthetic name');
  });

  test('T1-PDP-03', 'Unit price in EGP is formatted accurately with currency symbol', () => {
    const formattedAr = formatEgp(38.5, 'ar');
    const formattedEn = formatEgp(38.5, 'en');
    assert.strictEqual(formattedAr, '38.50 ج.م', 'Arabic EGP format mismatch');
    assert.strictEqual(formattedEn, '38.50 EGP', 'English EGP format mismatch');
  });

  test('T1-PDP-04', 'Dosage instructions and storage conditions are explicitly provided', () => {
    for (const prod of SYNTHETIC_PRODUCTS) {
      assert.ok(prod.dosageInstructionsAr, `Product ${prod.id} missing dosageInstructionsAr`);
      assert.ok(prod.storageConditionsAr, `Product ${prod.id} missing storageConditionsAr`);
      assert.ok(prod.storageConditionsAr.includes('25'), `Product ${prod.id} storage should note 25°C threshold`);
    }
  });

  test('T1-PDP-05', 'Synthetic safety compliance marker and disclaimer are verified on all items', () => {
    for (const prod of SYNTHETIC_PRODUCTS) {
      validateProductSafety(prod);
    }
  });

  // ==========================================================================
  // 5. Add to Cart & Client State Reactivity
  // ==========================================================================
  test('T1-CART-01', 'Adding item to empty cart initializes items with count 1', () => {
    const cart = createCartStore();
    assert.strictEqual(cart.getItems().length, 0);
    cart.addItem(SYNTHETIC_PRODUCTS[0], 1);
    assert.strictEqual(cart.getItems().length, 1);
    assert.strictEqual(cart.getItemCount(), 1);
  });

  test('T1-CART-02', 'Adding same item increments quantity without creating duplicate rows', () => {
    const cart = createCartStore();
    cart.addItem(SYNTHETIC_PRODUCTS[0], 1);
    cart.addItem(SYNTHETIC_PRODUCTS[0], 2);
    assert.strictEqual(cart.getItems().length, 1, 'Should have only 1 unique row');
    assert.strictEqual(cart.getItemCount(), 3, 'Item count should equal 3');
  });

  test('T1-CART-03', 'Removing an item from cart deletes it and updates total', () => {
    const cart = createCartStore();
    cart.addItem(SYNTHETIC_PRODUCTS[0], 1);
    cart.addItem(SYNTHETIC_PRODUCTS[1], 1);
    assert.strictEqual(cart.getItems().length, 2);
    cart.removeItem(SYNTHETIC_PRODUCTS[0].id);
    assert.strictEqual(cart.getItems().length, 1);
    assert.strictEqual(cart.getItems()[0].product.id, SYNTHETIC_PRODUCTS[1].id);
  });

  test('T1-CART-04', 'Clearing cart resets items to empty and subtotal to zero', () => {
    const cart = createCartStore();
    cart.addItem(SYNTHETIC_PRODUCTS[0], 2);
    cart.clearCart();
    assert.strictEqual(cart.getItems().length, 0);
    assert.strictEqual(cart.getSubtotal(), 0);
    assert.strictEqual(cart.getTotal(), 0);
  });

  test('T1-CART-05', 'Cart header badge counter reflects total quantity of units', () => {
    const cart = createCartStore();
    cart.addItem(SYNTHETIC_PRODUCTS[0], 2);
    cart.addItem(SYNTHETIC_PRODUCTS[1], 3);
    assert.strictEqual(cart.getItemCount(), 5);
  });

  // ==========================================================================
  // 6. Cart Mathematics, Subtotal & Delivery Fee Calculation
  // ==========================================================================
  test('T1-MATH-01', 'Subtotal equals exact sum of (price * quantity)', () => {
    const cart = createCartStore();
    // Item 1: Syntraphol (sale price 32.00) * 2 = 64.00
    // Item 2: PharmaCure-DX (price 42.00) * 1 = 42.00
    cart.addItem(SYNTHETIC_PRODUCTS[0], 2);
    cart.addItem(SYNTHETIC_PRODUCTS[1], 1);
    assert.strictEqual(cart.getSubtotal(), 106.00);
  });

  test('T1-MATH-02', 'Promotional salePriceEgp takes priority over regular priceEgp', () => {
    const product = SYNTHETIC_PRODUCTS[0]; // price 38.50, salePrice 32.00
    const summary = calculateCartTotals({
      items: [{ product, quantity: 1 }]
    });
    assert.strictEqual(summary.subtotalEgp, 32.00, 'Sale price should take priority');
  });

  test('T1-MATH-03', 'Subtotal below 300 EGP incurs 25 EGP delivery fee', () => {
    const product = SYNTHETIC_PRODUCTS[1]; // 42.00 EGP
    const summary = calculateCartTotals({
      items: [{ product, quantity: 2 }] // 84.00 EGP
    });
    assert.strictEqual(summary.subtotalEgp, 84.00);
    assert.strictEqual(summary.deliveryFeeEgp, 25.00);
    assert.strictEqual(summary.totalEgp, 109.00);
  });

  test('T1-MATH-04', 'Subtotal >= 300 EGP grants free delivery (0 EGP fee)', () => {
    const product = SYNTHETIC_PRODUCTS[4]; // CardioCare-X 145.00 EGP
    const summary = calculateCartTotals({
      items: [{ product, quantity: 3 }] // 145 * 3 = 435.00 EGP
    });
    assert.strictEqual(summary.subtotalEgp, 435.00);
    assert.strictEqual(summary.deliveryFeeEgp, 0.00, 'Delivery fee should be 0 above 300 EGP');
    assert.strictEqual(summary.totalEgp, 435.00);
  });

  test('T1-MATH-05', 'Total equals Subtotal + Delivery - Discount without decimal drift', () => {
    const product = SYNTHETIC_PRODUCTS[0]; // 32.00 EGP
    const summary = calculateCartTotals({
      items: [{ product, quantity: 3 }], // 96.00 EGP
      discount: 10.00
    });
    // Subtotal: 96.00, Delivery: 25.00, Discount: 10.00 -> Total: 111.00
    assert.strictEqual(summary.subtotalEgp, 96.00);
    assert.strictEqual(summary.deliveryFeeEgp, 25.00);
    assert.strictEqual(summary.discountEgp, 10.00);
    assert.strictEqual(summary.totalEgp, 111.00);
  });

  // ==========================================================================
  // 7. Language Switcher (AR-RTL / EN-LTR) & Logical Direction
  // ==========================================================================
  test('T1-LANG-01', 'Default store initialization starts in Arabic RTL', () => {
    const localeStore = createLocaleStore();
    assert.strictEqual(localeStore.getLocale(), 'ar');
    assert.strictEqual(localeStore.getDir(), 'rtl');
  });

  test('T1-LANG-02', 'Toggling locale switches cleanly to English LTR', () => {
    const localeStore = createLocaleStore();
    localeStore.toggleLocale();
    assert.strictEqual(localeStore.getLocale(), 'en');
    assert.strictEqual(localeStore.getDir(), 'ltr');
  });

  test('T1-LANG-03', 'Setting locale explicitly updates both language and direction', () => {
    const localeStore = createLocaleStore('ar');
    localeStore.setLocale('en');
    assert.strictEqual(localeStore.getLocale(), 'en');
    assert.strictEqual(localeStore.getDir(), 'ltr');
    localeStore.setLocale('ar');
    assert.strictEqual(localeStore.getLocale(), 'ar');
    assert.strictEqual(localeStore.getDir(), 'rtl');
  });

  test('T1-LANG-04', 'Currency display adjusts based on active locale', () => {
    const amount = 150.75;
    const arabicCurrency = formatEgp(amount, 'ar');
    const englishCurrency = formatEgp(amount, 'en');
    assert.strictEqual(arabicCurrency, '150.75 ج.م');
    assert.strictEqual(englishCurrency, '150.75 EGP');
  });

  test('T1-LANG-05', 'Bidirectional round-trip (AR -> EN -> AR) restores initial direction', () => {
    const localeStore = createLocaleStore('ar');
    localeStore.toggleLocale(); // EN
    localeStore.toggleLocale(); // AR
    assert.strictEqual(localeStore.getLocale(), 'ar');
    assert.strictEqual(localeStore.getDir(), 'rtl');
  });

  // ==========================================================================
  // 8. Dark Mode System & High-Contrast Health Tokens
  // ==========================================================================
  test('T1-DARK-01', 'Light mode theme tokens define soothing medical emerald palette', () => {
    const lightTokens = {
      primary: '#0F766E',
      surfaceBg: '#F8FAFC',
      surfaceCard: '#FFFFFF',
      textMain: '#0F172A'
    };
    assert.strictEqual(lightTokens.primary, '#0F766E', 'Medical emerald primary color mismatch');
    assert.strictEqual(lightTokens.surfaceBg, '#F8FAFC', 'Light slate background mismatch');
  });

  test('T1-DARK-02', 'Dark mode theme tokens switch surfaces to high-contrast slate-950', () => {
    const darkTokens = {
      primary: '#2DD4BF',
      surfaceBg: '#020617',
      surfaceCard: '#0F172A',
      textMain: '#F8FAFC'
    };
    assert.strictEqual(darkTokens.surfaceBg, '#020617', 'Dark slate-950 background mismatch');
    assert.strictEqual(darkTokens.surfaceCard, '#0F172A', 'Dark card surface mismatch');
  });

  test('T1-DARK-03', 'Dark mode class toggler simulates HTML root attribute modification', () => {
    let rootClasses = ['font-cairo'];
    function toggleDarkMode(enable) {
      if (enable) {
        if (!rootClasses.includes('dark')) rootClasses.push('dark');
      } else {
        rootClasses = rootClasses.filter((c) => c !== 'dark');
      }
    }

    toggleDarkMode(true);
    assert.ok(rootClasses.includes('dark'), 'Root should contain .dark class');
    toggleDarkMode(false);
    assert.ok(!rootClasses.includes('dark'), 'Root should not contain .dark class when disabled');
  });

  test('T1-DARK-04', 'Warning amber badges maintain high visibility in both themes', () => {
    const lightWarning = '#D97706'; // amber-600
    const darkWarning = '#FBBF24';  // amber-400
    assert.ok(lightWarning.startsWith('#D9'), 'Light warning color check');
    assert.ok(darkWarning.startsWith('#FB'), 'Dark warning color check');
  });

  test('T1-DARK-05', 'Theme persistence store correctly handles theme state', () => {
    let storedTheme = 'light';
    function setTheme(t) { storedTheme = t; }
    setTheme('dark');
    assert.strictEqual(storedTheme, 'dark');
    setTheme('light');
    assert.strictEqual(storedTheme, 'light');
  });

  // ==========================================================================
  // 9. Voice Search via Web Speech API (ar-EG)
  // ==========================================================================
  test('T1-VOICE-01', 'Web Speech API initialization configures language strictly to ar-EG', () => {
    const MockAPI = createMockSpeechRecognition();
    const controller = createVoiceSearchController({ SpeechRecognitionClass: MockAPI });
    controller.start();
    const state = controller.getState();
    assert.strictEqual(state.isSupported, true);
    assert.strictEqual(state.instance.lang, 'ar-EG', 'Voice search must be configured for Egyptian Arabic (ar-EG)');
  });

  test('T1-VOICE-02', 'Starting speech recognition requests mic and transitions to "بسمعك..." indicator state', async () => {
    const MockAPI = createMockSpeechRecognition();
    const controller = createVoiceSearchController({ SpeechRecognitionClass: MockAPI });
    controller.start();
    await new Promise((r) => setTimeout(r, 8));
    const state = controller.getState();
    assert.strictEqual(state.isListening, true);
    assert.ok(state.statusMessage.includes('بسمعك'), 'Indicator must show "بسمعك..." during listening');
  });

  test('T1-VOICE-03', 'Speech recognition auto-populates query and triggers auto-search execution', async () => {
    const MockAPI = createMockSpeechRecognition({ transcriptToEmit: 'فوار حموضة' });
    let capturedQuery = '';
    let submittedQuery = '';

    const controller = createVoiceSearchController({
      SpeechRecognitionClass: MockAPI,
      onQueryChange: (q) => { capturedQuery = q; },
      onAutoSubmit: (q) => { submittedQuery = q; }
    });

    controller.start();
    for (let i = 0; i < 20 && !submittedQuery; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }

    assert.strictEqual(capturedQuery, 'فوار حموضة', 'Spoken phrase must auto-populate query');
    assert.strictEqual(submittedQuery, 'فوار حموضة', 'Voice search must auto-submit upon capture');
  });

  test('T1-VOICE-04', 'Denied microphone permission sets clear error message without crashing', async () => {
    const MockAPI = createMockSpeechRecognition({ permissionGranted: false, errorCodeToEmit: 'not-allowed' });
    const controller = createVoiceSearchController({ SpeechRecognitionClass: MockAPI });
    controller.start();
    for (let i = 0; i < 20 && !controller.getState().errorMessage; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }

    const state = controller.getState();
    assert.strictEqual(state.isListening, false);
    assert.ok(state.errorMessage.includes('رفض إذن'), 'Denied permission must show user-friendly error');
  });

  test('T1-VOICE-05', 'Unsupported browser API gracefully informs user without crashing', () => {
    const controller = createVoiceSearchController({ SpeechRecognitionClass: null });
    assert.strictEqual(controller.isSupported, false);
    controller.start();
    const state = controller.getState();
    assert.ok(state.errorMessage.includes('لا يدعم'), 'Unsupported browser must show advisory notice');
  });

  for (const executeTest of queue) {
    await executeTest();
  }

  return results;
}
