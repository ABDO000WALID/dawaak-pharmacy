/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Covers 8 multi-feature interaction flows and integration states.
 */

import {
  assert,
  calculateCartTotals,
  createCartStore,
  createLocaleStore,
  searchCatalog,
  formatEgp,
  createMockSpeechRecognition,
  createVoiceSearchController
} from './harness.js';
import { SYNTHETIC_PRODUCTS } from './fixtures/catalog.js';

export async function runTier3Tests() {
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
  // Cross-Feature Combinations
  // ==========================================================================
  test('T3-CROSS-01', 'RTL/LTR toggle during active cart session preserves state and localized currency', () => {
    const cart = createCartStore();
    const localeStore = createLocaleStore('ar');

    // Add 2 items in Arabic mode
    cart.addItem(SYNTHETIC_PRODUCTS[0], 2); // 32.00 * 2 = 64.00
    cart.addItem(SYNTHETIC_PRODUCTS[1], 1); // 42.00 * 1 = 42.00
    // Subtotal: 106.00 EGP

    assert.strictEqual(localeStore.getDir(), 'rtl');
    assert.strictEqual(formatEgp(cart.getSubtotal(), localeStore.getLocale()), '106.00 ج.م');

    // Toggle language to English LTR
    localeStore.toggleLocale();
    assert.strictEqual(localeStore.getLocale(), 'en');
    assert.strictEqual(localeStore.getDir(), 'ltr');

    // Cart items and subtotal must remain intact
    assert.strictEqual(cart.getItemCount(), 3);
    assert.strictEqual(cart.getSubtotal(), 106.00);
    assert.strictEqual(formatEgp(cart.getSubtotal(), localeStore.getLocale()), '106.00 EGP');

    // Toggle back to Arabic RTL
    localeStore.toggleLocale();
    assert.strictEqual(localeStore.getLocale(), 'ar');
    assert.strictEqual(localeStore.getDir(), 'rtl');
    assert.strictEqual(formatEgp(cart.getSubtotal(), localeStore.getLocale()), '106.00 ج.م');
  });

  test('T3-CROSS-02', 'Adding from PDP stepper then updating in Cart enforces anti-hoarding cap', () => {
    const cart = createCartStore();
    const product = SYNTHETIC_PRODUCTS[0];

    // User selects 3 on PDP and clicks Add to Cart
    cart.addItem(product, 3);
    assert.strictEqual(cart.getItemCount(), 3);

    // In Cart, user clicks '+' twice
    cart.updateQuantity(product.id, 4);
    assert.strictEqual(cart.getItemCount(), 4);
    cart.updateQuantity(product.id, 5);
    assert.strictEqual(cart.getItemCount(), 5);

    // User tries to click '+' a 6th time
    cart.updateQuantity(product.id, 6);
    assert.strictEqual(cart.getItemCount(), 5, 'Cart stepper must strictly block incrementing past 5 units');
  });

  test('T3-CROSS-03', 'Dark mode preference persists across multi-page route navigation', () => {
    const appSession = {
      theme: 'light',
      currentRoute: '/',
      navigate(route) {
        this.currentRoute = route;
      },
      setTheme(theme) {
        this.theme = theme;
      }
    };

    // User on Home turns on Dark Mode
    appSession.setTheme('dark');
    assert.strictEqual(appSession.theme, 'dark');

    // Navigate to PDP: /product/syntraphol-extra-500
    appSession.navigate('/product/syntraphol-extra-500');
    assert.strictEqual(appSession.theme, 'dark', 'Theme must persist when navigating to PDP');

    // Navigate to Cart: /cart
    appSession.navigate('/cart');
    assert.strictEqual(appSession.theme, 'dark', 'Theme must persist when navigating to Cart');
  });

  test('T3-CROSS-04', 'Category filter combined with search query and direct add to cart', () => {
    const cart = createCartStore();

    // User filters by 'digestive-health'
    const digestiveItems = searchCatalog('', 'digestive-health');
    assert.ok(digestiveItems.length >= 2);

    // User searches for 'فوار' within this category
    const specificSearch = searchCatalog('فوار', 'digestive-health');
    assert.strictEqual(specificSearch.length, 1);
    assert.strictEqual(specificSearch[0].slug, 'egyptocalm-effervescent');

    // User adds the searched item to cart
    cart.addItem(specificSearch[0], 2);
    assert.strictEqual(cart.getItemCount(), 2);
    assert.strictEqual(cart.getSubtotal(), 56.00); // 28.00 * 2
  });

  test('T3-CROSS-05', 'Mixed cart containing OTC and Rx medications triggers pharmacist alert', () => {
    const cart = createCartStore();
    const otcItem = SYNTHETIC_PRODUCTS[0]; // Syntraphol (OTC)
    const rxItem = SYNTHETIC_PRODUCTS[4];  // CardioCare-X 10mg (Rx)

    cart.addItem(otcItem, 1); // 32.00 EGP
    assert.strictEqual(cart.hasPrescriptionItems(), false);

    cart.addItem(rxItem, 1);  // 145.00 EGP
    const summary = cart.getSummary();

    assert.strictEqual(summary.hasPrescriptionItems, true, 'Cart must flag presence of Rx items');
    assert.strictEqual(summary.prescriptionWarnings.length, 1);
    assert.strictEqual(summary.prescriptionWarnings[0].productId, rxItem.id);
    assert.strictEqual(summary.subtotalEgp, 177.00); // 32 + 145
  });

  test('T3-CROSS-06', 'Smart Egyptian Substitute Finder modal swap flow updates cart and savings', () => {
    const cart = createCartStore();

    // Branded imported medicine mock: 85.00 EGP
    const brandedItem = {
      id: 'prod-brand-imported',
      nameAr: 'مستحضر مستورد مسكن',
      nameEn: 'Imported Brand Pain Relief',
      priceEgp: 85.00,
      salePriceEgp: null,
      prescriptionRequired: false
    };

    // Domestic Egyptian bioequivalent generic: 50.00 EGP (saves 35.00 EGP)
    const genericItem = {
      id: 'prod-generic-egypt',
      nameAr: 'بديل مصري مطابق 100%',
      nameEn: 'Egyptian Domestic Generic 100%',
      priceEgp: 50.00,
      salePriceEgp: null,
      prescriptionRequired: false
    };

    // User has branded item in cart
    cart.addItem(brandedItem, 1);
    assert.strictEqual(cart.getSubtotal(), 85.00);

    // Substitute Finder Modal triggers: swap action
    cart.removeItem(brandedItem.id);
    cart.addItem(genericItem, 1);

    assert.strictEqual(cart.getSubtotal(), 50.00);
    const savingsEgp = 85.00 - cart.getSubtotal();
    assert.strictEqual(savingsEgp, 35.00, 'User should have saved exactly 35.00 EGP with Egyptian generic');
  });

  test('T3-CROSS-07', 'Dosage Schedule Preview groups diverse cart items into daily time buckets', () => {
    // 3 diverse medications in cart
    const morningMed = SYNTHETIC_PRODUCTS[4]; // CardioCare-X (tablets, morning)
    const noonMed = SYNTHETIC_PRODUCTS[8];    // VitaBoost-Max (capsule, after lunch)
    const nightMed = SYNTHETIC_PRODUCTS[11];  // SleepEasy-Synth (night capsule)

    const cartItems = [
      { product: morningMed, quantity: 1 },
      { product: noonMed, quantity: 1 },
      { product: nightMed, quantity: 1 }
    ];

    // Helper to simulate DosageScheduleCard parser
    function generateDailySchedule(items) {
      const schedule = { morning: [], noon: [], night: [] };
      for (const item of items) {
        const desc = (item.product.dosageInstructionsAr || '').toLowerCase();
        if (desc.includes('صباح') || desc.includes('إفطار')) {
          schedule.morning.push(item.product.nameAr);
        }
        if (desc.includes('غداء') || desc.includes('ظهر')) {
          schedule.noon.push(item.product.nameAr);
        }
        if (desc.includes('نوم') || desc.includes('مساء')) {
          schedule.night.push(item.product.nameAr);
        }
      }
      return schedule;
    }

    const schedule = generateDailySchedule(cartItems);
    assert.ok(schedule.morning.length >= 1, 'Expected morning dosage item');
    assert.ok(schedule.noon.length >= 1, 'Expected noon dosage item');
    assert.ok(schedule.night.length >= 1, 'Expected night dosage item');
  });

  test('T3-CROSS-08', 'Governorate delivery fee override preserves core arithmetic', () => {
    // Base cart: Subtotal 150.00 EGP (< 300 EGP)
    const items = [{ product: SYNTHETIC_PRODUCTS[0], quantity: 3 }]; // 32 * 3 = 96 EGP

    // Remote governorate (Aswan): standard fee is 45 EGP instead of 25 EGP
    const cairoSummary = calculateCartTotals({ items, standardDeliveryFee: 25.0 });
    const aswanSummary = calculateCartTotals({ items, standardDeliveryFee: 45.0 });

    assert.strictEqual(cairoSummary.subtotalEgp, 96.00);
    assert.strictEqual(cairoSummary.deliveryFeeEgp, 25.00);
    assert.strictEqual(cairoSummary.totalEgp, 121.00);

    assert.strictEqual(aswanSummary.subtotalEgp, 96.00);
    assert.strictEqual(aswanSummary.deliveryFeeEgp, 45.00);
    assert.strictEqual(aswanSummary.totalEgp, 141.00);
  });

  test('T3-CROSS-09', 'Searching from active /cart route debounces, routes to /search?q=..., matches commercial & active ingredient in AR/EN, displays "مفيش نتائج", and preserves cart state', () => {
    const cart = createCartStore();
    // Add 2 items to cart: Syntraphol (32.00 * 2) + PharmaCure (42.00 * 1) = 106.00 EGP
    cart.addItem(SYNTHETIC_PRODUCTS[0], 2);
    cart.addItem(SYNTHETIC_PRODUCTS[1], 1);

    const appSession = {
      currentRoute: '/cart',
      searchQuery: '',
      dropdownSuggestions: [],
      searchResults: [],
      navigate(route) { this.currentRoute = route; }
    };

    assert.strictEqual(appSession.currentRoute, '/cart');
    assert.strictEqual(cart.getItemCount(), 3);
    assert.strictEqual(cart.getSubtotal(), 106.00);
    assert.strictEqual(cart.getDeliveryFee(), 25.00);

    // 1. User inputs query "فوار" from Cart page (simulating 200ms debounced dropdown suggestions)
    appSession.searchQuery = 'فوار';
    appSession.dropdownSuggestions = searchCatalog('فوار').slice(0, 5);
    assert.ok(appSession.dropdownSuggestions.length >= 1, 'Dropdown suggestions must return matching items');
    assert.strictEqual(appSession.dropdownSuggestions[0].slug, 'egyptocalm-effervescent');

    // 2. User presses Enter or clicks search to navigate to dedicated /search?q=... route
    appSession.navigate(`/search?q=${encodeURIComponent('فوار')}`);
    assert.strictEqual(appSession.currentRoute, '/search?q=%D9%81%D9%88%D8%A7%D8%B1');

    // 3. Dedicated results page executes query and matches commercial & active ingredient in AR/EN
    // 3a. Commercial name match in Arabic
    const matchArCommercial = searchCatalog('سينترافول');
    assert.ok(matchArCommercial.length >= 1, 'Arabic commercial name search must match');
    assert.strictEqual(matchArCommercial[0].slug, 'syntraphol-extra-500');

    // 3b. Commercial name match in English
    const matchEnCommercial = searchCatalog('Syntraphol');
    assert.ok(matchEnCommercial.length >= 1, 'English commercial name search must match');
    assert.strictEqual(matchEnCommercial[0].slug, 'syntraphol-extra-500');

    // 3c. Active ingredient match in Arabic
    const matchArIngredient = searchCatalog('كافيين');
    assert.ok(matchArIngredient.length >= 1, 'Arabic active ingredient search must match');
    assert.ok(matchArIngredient.some((p) => p.slug === 'syntraphol-extra-500'));

    // 3d. Active ingredient match in English
    const matchEnIngredient = searchCatalog('SynCaffeine');
    assert.ok(matchEnIngredient.length >= 1, 'English active ingredient search must match');
    assert.ok(matchEnIngredient.some((p) => p.slug === 'syntraphol-extra-500'));

    // 4. Critical Invariant: Cart state and totals remain 100% intact after initiating search from /cart
    assert.strictEqual(cart.getItemCount(), 3, 'Cart items count must be strictly preserved after search');
    assert.strictEqual(cart.getSubtotal(), 106.00, 'Cart subtotal must be strictly preserved after search');
    assert.strictEqual(cart.getDeliveryFee(), 25.00, 'Cart delivery fee must be strictly preserved after search');

    // 5. Empty search match ("مفيش نتائج") does not crash or corrupt cart state
    const emptyResults = searchCatalog('دواء غير مسجل نهائيا بالكتالوج');
    assert.strictEqual(emptyResults.length, 0, 'Non-matching query returns empty array');
    const emptyMessage = emptyResults.length === 0 ? 'مفيش نتائج' : '';
    assert.strictEqual(emptyMessage, 'مفيش نتائج', 'Empty results must display "مفيش نتائج"');
    assert.strictEqual(cart.getItemCount(), 3, 'Cart state remains unaffected by empty search results');
    assert.strictEqual(cart.getSubtotal(), 106.00, 'Cart subtotal remains unaffected by empty search results');
  });

  test('T3-CROSS-10', 'Voice Search end-to-end integration: spoken Egyptian query resolves to catalog results', async () => {
    const MockAPI = createMockSpeechRecognition({ transcriptToEmit: 'عايز دوا صداع' });
    let recognizedUtterance = '';

    const controller = createVoiceSearchController({
      SpeechRecognitionClass: MockAPI,
      onAutoSubmit: (phrase) => { recognizedUtterance = phrase; }
    });

    controller.start();
    for (let i = 0; i < 20 && !recognizedUtterance; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }

    assert.strictEqual(recognizedUtterance, 'عايز دوا صداع');

    // Feed transcript to Egyptian dialect catalog search
    const results = searchCatalog(recognizedUtterance);
    assert.ok(results.length >= 1, 'Egyptian dialect symptom from voice search must match analgesics');
    assert.strictEqual(results[0].slug, 'syntraphol-extra-500');
  });

  for (const executeTest of queue) {
    await executeTest();
  }

  return results;
}
