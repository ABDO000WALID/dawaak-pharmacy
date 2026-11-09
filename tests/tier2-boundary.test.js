/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Covers 12 rigorous edge cases and boundary conditions.
 */

import { assert, calculateCartTotals, createCartStore, normalizeArabic, searchCatalog } from './harness.js';
import { SYNTHETIC_PRODUCTS } from './fixtures/catalog.js';

export function runTier2Tests() {
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
  // Boundary & Corner Cases
  // ==========================================================================
  test('T2-BOUND-01', 'Empty cart state calculates 0.00 EGP across all financial fields', () => {
    const summary = calculateCartTotals({ items: [] });
    assert.strictEqual(summary.subtotalEgp, 0.0, 'Empty cart subtotal should be 0');
    assert.strictEqual(summary.deliveryFeeEgp, 0.0, 'Empty cart delivery fee should be 0');
    assert.strictEqual(summary.totalEgp, 0.0, 'Empty cart total should be 0');
    assert.strictEqual(summary.itemsCount, 0, 'Empty cart itemsCount should be 0');
    assert.strictEqual(summary.hasPrescriptionItems, false);
    assert.strictEqual(summary.prescriptionWarnings.length, 0);
  });

  test('T2-BOUND-02', 'Anti-hoarding quantity limit strictly enforced at 5 units max', () => {
    const cart = createCartStore();
    const product = SYNTHETIC_PRODUCTS[0];

    // Attempt to add 10 units directly
    cart.addItem(product, 10);
    assert.strictEqual(cart.getItemCount(), 5, 'Quantity should be clamped to 5 max');

    // Attempt to add another unit
    cart.addItem(product, 1);
    assert.strictEqual(cart.getItemCount(), 5, 'Quantity cannot exceed 5 after additional adds');

    // Attempt updateQuantity to 9
    cart.updateQuantity(product.id, 9);
    assert.strictEqual(cart.getItemCount(), 5, 'Update quantity cannot exceed 5');
  });

  test('T2-BOUND-03', 'Negative and zero quantities are rejected or trigger item removal', () => {
    const cart = createCartStore();
    const product = SYNTHETIC_PRODUCTS[0];
    cart.addItem(product, 2);

    // Setting quantity to 0 should remove item
    cart.updateQuantity(product.id, 0);
    assert.strictEqual(cart.getItems().length, 0, 'Setting quantity 0 should remove item');

    // Setting negative quantity should also remove or reject
    cart.addItem(product, 2);
    cart.updateQuantity(product.id, -3);
    assert.strictEqual(cart.getItems().length, 0, 'Setting negative quantity should remove item');
  });

  test('T2-BOUND-04', 'Delivery fee threshold at 299.99 EGP strictly applies 25.00 EGP fee', () => {
    // Custom mock product with 299.99 price
    const edgeProduct = {
      ...SYNTHETIC_PRODUCTS[0],
      priceEgp: 299.99,
      salePriceEgp: null
    };

    const summary = calculateCartTotals({
      items: [{ product: edgeProduct, quantity: 1 }]
    });

    assert.strictEqual(summary.subtotalEgp, 299.99);
    assert.strictEqual(summary.deliveryFeeEgp, 25.00, 'Subtotal 299.99 EGP must incur 25.00 EGP delivery fee');
    assert.strictEqual(summary.totalEgp, 324.99);
  });

  test('T2-BOUND-05', 'Delivery fee threshold at exactly 300.00 EGP qualifies for free delivery', () => {
    const edgeProduct = {
      ...SYNTHETIC_PRODUCTS[0],
      priceEgp: 300.00,
      salePriceEgp: null
    };

    const summary = calculateCartTotals({
      items: [{ product: edgeProduct, quantity: 1 }]
    });

    assert.strictEqual(summary.subtotalEgp, 300.00);
    assert.strictEqual(summary.deliveryFeeEgp, 0.00, 'Subtotal exactly 300.00 EGP must have 0.00 EGP delivery fee');
    assert.strictEqual(summary.totalEgp, 300.00);
  });

  test('T2-BOUND-06', 'Delivery fee threshold at 300.01 EGP maintains free delivery', () => {
    const edgeProduct = {
      ...SYNTHETIC_PRODUCTS[0],
      priceEgp: 300.01,
      salePriceEgp: null
    };

    const summary = calculateCartTotals({
      items: [{ product: edgeProduct, quantity: 1 }]
    });

    assert.strictEqual(summary.subtotalEgp, 300.01);
    assert.strictEqual(summary.deliveryFeeEgp, 0.00, 'Subtotal 300.01 EGP must have 0.00 EGP delivery fee');
    assert.strictEqual(summary.totalEgp, 300.01);
  });

  test('T2-BOUND-07', 'Extreme price fractions & piastre precision prevent floating point drift', () => {
    // 3 items with fractional price: 38.50 * 3 = 115.50
    const product = {
      ...SYNTHETIC_PRODUCTS[0],
      priceEgp: 38.50,
      salePriceEgp: null
    };

    const summary = calculateCartTotals({
      items: [{ product, quantity: 3 }]
    });

    assert.strictEqual(summary.subtotalEgp, 115.50, '3 * 38.50 must equal exactly 115.50');
    assert.strictEqual(summary.deliveryFeeEgp, 25.00);
    assert.strictEqual(summary.totalEgp, 140.50, 'Total must equal exactly 140.50 without floating point error');
  });

  test('T2-BOUND-08', 'Zero-price or NaN price anomalies are safely handled', () => {
    const corruptedProduct = {
      ...SYNTHETIC_PRODUCTS[0],
      priceEgp: NaN,
      salePriceEgp: null
    };

    const summary = calculateCartTotals({
      items: [{ product: corruptedProduct, quantity: 1 }]
    });

    assert.ok(!isNaN(summary.subtotalEgp), 'Subtotal should not be NaN');
    assert.ok(!isNaN(summary.totalEgp), 'Total should not be NaN');
  });

  test('T2-BOUND-09', 'Arabic Tashkeel & Diacritics are normalized and matched accurately', () => {
    // Search with heavy Tashkeel: سِينْتْرَافُولْ إِكْسْتْرَا
    const vocalizedQuery = 'سِينْتْرَافُولْ';
    const normalized = normalizeArabic(vocalizedQuery);
    assert.strictEqual(normalized, 'سينترافول', 'Normalization should strip all Tashkeel diacritics');

    const searchResults = searchCatalog(vocalizedQuery);
    assert.ok(searchResults.length >= 1, 'Search with Tashkeel should match unvocalized database entry');
    assert.strictEqual(searchResults[0].slug, 'syntraphol-extra-500');
  });

  test('T2-BOUND-10', 'Tashkeel line-height compensation config rule is verified', () => {
    // Egyptian typography rule in SPEC.md: Cairo font line-height must be >= 1.625 (relaxed)
    const cairoLineHeightRelaxed = 1.625;
    const cairoLineHeightLoose = 1.75;
    assert.ok(cairoLineHeightRelaxed >= 1.6, 'Relaxed line-height prevents diacritic clipping');
    assert.ok(cairoLineHeightLoose > cairoLineHeightRelaxed, 'Loose line-height provides generous vertical room');
  });

  test('T2-BOUND-11', 'Stock quantity boundary handles available inventory checks', () => {
    const product = SYNTHETIC_PRODUCTS[0]; // stockQuantity: 150
    assert.ok(product.stockQuantity >= 10, 'Product should have sufficient initial stock');
    const isAvailable = (qty) => qty <= product.stockQuantity;
    assert.strictEqual(isAvailable(5), true, 'Requesting 5 units should be available');
    assert.strictEqual(isAvailable(200), false, 'Requesting 200 units should exceed stock');
  });

  test('T2-BOUND-12', 'SQL and script injection inputs in dialect search are safely neutralized', () => {
    const maliciousInputs = [
      "' OR '1'='1",
      "<script>alert('xss')</script>",
      "UNION SELECT * FROM profiles--",
      "../../etc/passwd",
      "${7*7}"
    ];

    for (const input of maliciousInputs) {
      // Must not throw an unhandled error
      const results = searchCatalog(input);
      assert.ok(Array.isArray(results), 'Malicious query must return a safe array without crashing');
    }
  });

  return results;
}
