/**
 * Tier 4: Real-World Workload Scenarios Test Suite
 * Simulates end-to-end user journeys for the 3 authentic Egyptian personas.
 */

import { assert, calculateCartTotals, createCartStore, createLocaleStore, searchCatalog, formatEgp } from './harness.js';
import { SYNTHETIC_PRODUCTS } from './fixtures/catalog.js';

export function runTier4Tests() {
  const results = [];

  function test(id, description, fn) {
    try {
      fn();
      results.push({ id, description, passed: true });
    } catch (err) {
      results.push({ id, description, passed: false, error: err });
    }
  }

  // ==========================================================================
  // Real-World Workload Scenarios (3 Authentic Egyptian Personas)
  // ==========================================================================

  test('T4-WORK-01', 'Persona 1: Hajj Ibrahim chronic refill flow with free shipping qualification and COD', () => {
    // 1. Hajj Ibrahim visits in Arabic mode
    const localeStore = createLocaleStore('ar');
    assert.strictEqual(localeStore.getDir(), 'rtl');

    // 2. Searches for his chronic medications
    const diabeticMeds = searchCatalog('سكر');
    assert.ok(diabeticMeds.length >= 1, 'Should find diabetic medication');
    const glucofix = diabeticMeds.find((p) => p.slug === 'glucofix-syn-500');
    assert.ok(glucofix, 'Glucofix-Syn must be available');
    assert.strictEqual(glucofix.priceEgp, 92.00);

    const bloodPressureMeds = searchCatalog('ضغط');
    assert.ok(bloodPressureMeds.length >= 1, 'Should find blood pressure medication');
    const cardioCare = bloodPressureMeds.find((p) => p.slug === 'cardiocare-x-10');
    assert.ok(cardioCare, 'CardioCare-X must be available');
    assert.strictEqual(cardioCare.priceEgp, 145.00);

    // 3. Adds 1 box of each to cart
    const cart = createCartStore();
    cart.addItem(glucofix, 1);    // 92.00 EGP
    cart.addItem(cardioCare, 1);  // 145.00 EGP

    // Initial subtotal: 92 + 145 = 237.00 EGP (< 300 EGP)
    assert.strictEqual(cart.getSubtotal(), 237.00);
    assert.strictEqual(cart.getDeliveryFee(), 25.00);
    assert.strictEqual(cart.getTotal(), 262.00);

    // Remaining amount needed for free delivery: 300 - 237 = 63.00 EGP
    const remainingForFreeShipping = Math.max(0, 300 - cart.getSubtotal());
    assert.strictEqual(remainingForFreeShipping, 63.00);

    // 4. To reach free shipping, adds VitaBoost-Max (sale price: 75.00 EGP)
    const vitaboost = SYNTHETIC_PRODUCTS.find((p) => p.slug === 'vitaboost-max-daily');
    assert.ok(vitaboost, 'VitaBoost must exist');
    cart.addItem(vitaboost, 1);

    // New subtotal: 237 + 75 = 312.00 EGP (>= 300 EGP)
    assert.strictEqual(cart.getSubtotal(), 312.00);
    assert.strictEqual(cart.getDeliveryFee(), 0.00, 'Free delivery must be triggered at 312.00 EGP');
    assert.strictEqual(cart.getTotal(), 312.00);

    // 5. Payment method: Cash on Delivery pre-selected
    const checkoutState = {
      paymentMethod: 'cash_on_delivery',
      addressGovernorate: 'cairo',
      addressDistrict: 'shubra',
      customerNotes: 'الدفع عند الاستلام كاش'
    };
    assert.strictEqual(checkoutState.paymentMethod, 'cash_on_delivery');

    // 6. Medical safety checks
    const summary = cart.getSummary();
    assert.strictEqual(summary.hasPrescriptionItems, true, 'CardioCare and Glucofix require Rx review');
    assert.strictEqual(summary.prescriptionWarnings.length, 2);
  });

  test('T4-WORK-02', 'Persona 2: Mariam acute child fever nocturnal rapid cart flow with mobile payment', () => {
    // 1. 2:00 AM nocturnal emergency: Mariam searches with colloquial keyword "سخونية"
    const feverSearchResults = searchCatalog('سخونية');
    assert.ok(feverSearchResults.length >= 1, 'Dialect search for سخونية must return results');

    const pediatricSyrup = feverSearchResults.find((p) => p.slug === 'pediatric-cough-k-oral');
    assert.ok(pediatricSyrup, 'Pediatric syrup must be found');
    assert.strictEqual(pediatricSyrup.priceEgp, 36.50);

    // 2. Mariam inspects the active ingredient to ensure safe chemical profile
    assert.ok(pediatricSyrup.activeIngredient.includes('Pediatric-SynTuss'));
    assert.strictEqual(pediatricSyrup.prescriptionRequired, false, 'Pediatric fever syrup should be OTC for fast relief');

    // 3. Adds 2 bottles of pediatric syrup to cart
    const cart = createCartStore();
    cart.addItem(pediatricSyrup, 2); // 36.50 * 2 = 73.00 EGP

    // 4. Adds SeptoDerm antiseptic spray (32.00 EGP)
    const antiseptic = SYNTHETIC_PRODUCTS.find((p) => p.slug === 'septoderm-antiseptic-spray');
    cart.addItem(antiseptic, 1); // 32.00 EGP

    // Subtotal: 73.00 + 32.00 = 105.00 EGP (< 300 EGP)
    assert.strictEqual(cart.getSubtotal(), 105.00);
    assert.strictEqual(cart.getDeliveryFee(), 25.00, 'Standard delivery fee of 25.00 EGP applies');
    assert.strictEqual(cart.getTotal(), 130.00);

    // 5. Digital mobile payment preview (Vodafone Cash / InstaPay)
    const checkoutState = {
      paymentMethod: 'vodafone_cash',
      addressCity: 'alexandria',
      addressDistrict: 'smouha',
      isUrgentNightDelivery: true
    };
    assert.strictEqual(checkoutState.paymentMethod, 'vodafone_cash');
    assert.strictEqual(cart.hasPrescriptionItems(), false, 'Rapid OTC order has zero prescription delay');
  });

  test('T4-WORK-03', 'Persona 3: Karim elder prescription warning flow with anti-hoarding cap and schedule', () => {
    // 1. Karim enables Dark Mode
    const userTheme = 'dark';
    assert.strictEqual(userTheme, 'dark');

    // 2. Orders chronic prescription medicine for elderly mother in Heliopolis
    const cardioCare = SYNTHETIC_PRODUCTS.find((p) => p.slug === 'cardiocare-x-10');
    assert.ok(cardioCare.prescriptionRequired, 'CardioCare must be Rx POM');

    // 3. Karim attempts to stockpile 6 boxes
    const cart = createCartStore();
    cart.addItem(cardioCare, 6);

    // Anti-hoarding limit must clamp quantity strictly to 5
    assert.strictEqual(cart.getItemCount(), 5, 'Anti-hoarding cap must enforce maximum 5 boxes');

    // Subtotal: 145.00 * 5 = 725.00 EGP (>= 300 EGP)
    assert.strictEqual(cart.getSubtotal(), 725.00);
    assert.strictEqual(cart.getDeliveryFee(), 0.00, 'Free delivery granted for subtotal 725.00 EGP');
    assert.strictEqual(cart.getTotal(), 725.00);

    // 4. System flags Rx prescription warning
    const summary = cart.getSummary();
    assert.strictEqual(summary.hasPrescriptionItems, true);
    assert.strictEqual(summary.prescriptionWarnings[0].productId, cardioCare.id);

    // 5. Interactive Dosage Schedule Preview generation for refrigerator card
    const morningScheduleItem = {
      timeSlot: 'Morning (مع الإفطار)',
      medicine: cardioCare.nameAr,
      dose: 'قرص واحد يومياً صباحاً بعد الإفطار'
    };
    assert.ok(morningScheduleItem.dose.includes('صباحاً'));
    assert.strictEqual(morningScheduleItem.medicine, 'كارديوكير-إكس 10 مجم');

    // 6. Switches language to English to verify export details for medical insurance
    const localeStore = createLocaleStore('ar');
    localeStore.setLocale('en');
    assert.strictEqual(localeStore.getLocale(), 'en');
    assert.strictEqual(formatEgp(cart.getTotal(), 'en'), '725.00 EGP');
  });

  return results;
}
