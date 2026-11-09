/**
 * Egyptian Online Pharmacy — Test Harness & Domain Logic Engine
 * Provides testing primitives, cart arithmetic, Arabic normalizer, and domain contract verifiers.
 */

import assert from 'node:assert/strict';
import { SYNTHETIC_PRODUCTS, CATEGORIES } from './fixtures/catalog.js';

/**
 * Egyptian Colloquial Symptom & Dialect Keyword Dictionary
 */
export const DIALECT_MAPPINGS = {
  'صداع': ['syntraphol-extra-500'],
  'سخونية': ['syntraphol-extra-500', 'pediatric-cough-k-oral'],
  'حرارة': ['syntraphol-extra-500', 'pediatric-cough-k-oral'],
  'حموضة': ['egyptocalm-effervescent', 'gastroshield-m-20'],
  'فوار': ['egyptocalm-effervescent'],
  'مغص': ['egyptocalm-effervescent', 'gastroshield-m-20'],
  'ضغط': ['cardiocare-x-10'],
  'سكر': ['glucofix-syn-500'],
  'كحة': ['pharmacure-dx-syrup', 'pediatric-cough-k-oral'],
  'سعال': ['pharmacure-dx-syrup', 'pediatric-cough-k-oral'],
  'بلغم': ['pharmacure-dx-syrup'],
  'أعصاب': ['neurorelief-z-50'],
  'عين': ['ocuclear-s-eye-drops'],
  'عيني': ['ocuclear-s-eye-drops'],
  'جفاف': ['ocuclear-s-eye-drops', 'dermoheal-plus-gel'],
  'فيتامين': ['vitaboost-max-daily'],
  'فيتامينات': ['vitaboost-max-daily', 'sleepeasy-synth-night'],
  'نوم': ['sleepeasy-synth-night'],
  'أرق': ['sleepeasy-synth-night'],
  'مفاصل': ['osteojoint-synth-extra'],
  'ركبة': ['osteojoint-synth-extra'],
  'خشونة': ['osteojoint-synth-extra'],
  'مطهر': ['septoderm-antiseptic-spray'],
  'جروح': ['septoderm-antiseptic-spray', 'dermoheal-plus-gel'],
  'حروق': ['dermoheal-plus-gel'],
  'أطفال': ['pediatric-cough-k-oral']
};

/**
 * Normalizes Arabic text by decomposing presentation ligatures, stripping Tashkeel
 * diacritics, Tanween Fath accusative Alefs, Tatweel (Kashida), and unifying variant letterforms
 * (Alefs with hamza/wasla, Taa Marbuta to Haa, and Yaa maqsoora to standard Yaa).
 */
export function normalizeArabic(text) {
  if (typeof text !== 'string') return '';
  return text
    // Decompose Unicode ligatures & presentation forms (e.g., ﻻ -> لا)
    .normalize('NFKC')
    // Strip Tanween Fath with its orthographic Alef (e.g. سِينترافولاً -> سِينترافول)
    .replace(/(?:[\u0640]*\u0627[\u0640]*\u064B|[\u0640]*\u064B[\u0640]*\u0627)/g, '')
    // Remove Tashkeel (Fatha, Damma, Kasra, Sukun, Shadda, Tanween, Dagger Alef) AND Tatweel (\u0640)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Alefs (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Yaa (ى -> ي)
    .replace(/[ىي]/g, 'ي')
    .trim()
    .toLowerCase();
}

/**
 * Egyptian Currency Formatter (EGP / ج.م)
 */
export function formatEgp(amount, locale = 'ar') {
  const rounded = Number(amount || 0).toFixed(2);
  if (locale === 'ar') {
    return `${rounded} ج.م`;
  }
  return `${rounded} EGP`;
}

/**
 * Cart Arithmetic Engine
 * Subtotal = sum(unitPrice * quantity)
 * Free delivery threshold = 300.00 EGP
 * Standard delivery fee = 25.00 EGP (0.00 if cart empty or >= 300)
 */
export function calculateCartTotals({
  items = [],
  discount = 0,
  freeThreshold = 300.0,
  standardDeliveryFee = 25.0
}) {
  let subtotal = 0;
  let itemsCount = 0;
  let hasPrescriptionItems = false;
  const prescriptionWarnings = [];

  for (const item of items) {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const rawPrice =
      item.product.salePriceEgp !== undefined && item.product.salePriceEgp !== null
        ? item.product.salePriceEgp
        : item.product.priceEgp;
    const unitPrice = isNaN(Number(rawPrice)) ? 0 : Math.max(0, Number(rawPrice));

    const lineTotal = Math.round(unitPrice * qty * 100) / 100;
    subtotal += lineTotal;
    itemsCount += qty;

    if (item.product.prescriptionRequired && qty > 0) {
      hasPrescriptionItems = true;
      prescriptionWarnings.push({
        productId: item.product.id,
        productNameAr: item.product.nameAr,
        messageAr: 'يتطلب هذا المستحضر روشتة طبية سارية من طبيب مختص'
      });
    }
  }

  // Round subtotal to 2 decimals to eliminate floating point drift
  subtotal = Math.round(subtotal * 100) / 100;

  // Delivery fee logic
  let deliveryFee = 0;
  if (subtotal > 0) {
    deliveryFee = subtotal >= freeThreshold ? 0.0 : standardDeliveryFee;
  }

  const roundedDiscount = Math.round(Number(discount || 0) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal + deliveryFee - roundedDiscount) * 100) / 100);

  return {
    itemsCount,
    subtotalEgp: subtotal,
    deliveryFeeEgp: deliveryFee,
    freeDeliveryThresholdEgp: freeThreshold,
    discountEgp: roundedDiscount,
    totalEgp: total,
    hasPrescriptionItems,
    prescriptionWarnings
  };
}

/**
 * In-Memory Zustand Cart Store Simulation
 * Implements anti-hoarding limits (max 5 units), item removal, and auto recalculation
 */
export function createCartStore(initialItems = []) {
  let items = [...initialItems];

  function getSummary() {
    return calculateCartTotals({ items });
  }

  return {
    getItems: () => [...items],
    addItem: (product, qty = 1) => {
      if (!product || !product.id) throw new Error('Invalid product');
      const addQty = Math.max(1, Number(qty) || 1);
      const existingIndex = items.findIndex((i) => i.product.id === product.id);

      if (existingIndex >= 0) {
        const currentQty = items[existingIndex].quantity;
        // Anti-hoarding limit check: capped strictly at 5
        const targetQty = Math.min(5, currentQty + addQty);
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: targetQty
        };
      } else {
        const targetQty = Math.min(5, addQty);
        items.push({
          product,
          quantity: targetQty
        });
      }
    },
    updateQuantity: (productId, newQty) => {
      const parsedQty = Number(newQty);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        items = items.filter((i) => i.product.id !== productId);
        return;
      }
      const existing = items.find((i) => i.product.id === productId);
      if (existing) {
        existing.quantity = Math.min(5, Math.max(1, parsedQty));
      }
    },
    removeItem: (productId) => {
      items = items.filter((i) => i.product.id !== productId);
    },
    clearCart: () => {
      items = [];
    },
    getSummary,
    getSubtotal: () => getSummary().subtotalEgp,
    getDeliveryFee: () => getSummary().deliveryFeeEgp,
    getTotal: () => getSummary().totalEgp,
    getItemCount: () => getSummary().itemsCount,
    hasPrescriptionItems: () => getSummary().hasPrescriptionItems
  };
}

/**
 * Locale & Direction Store Simulation
 */
export function createLocaleStore(initialLocale = 'ar') {
  let locale = initialLocale;
  let dir = initialLocale === 'ar' ? 'rtl' : 'ltr';

  return {
    getLocale: () => locale,
    getDir: () => dir,
    setLocale: (newLocale) => {
      locale = newLocale === 'en' ? 'en' : 'ar';
      dir = locale === 'ar' ? 'rtl' : 'ltr';
    },
    toggleLocale: () => {
      locale = locale === 'ar' ? 'en' : 'ar';
      dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  };
}

/**
 * Search and Dialect Query Engine
 */
export function searchCatalog(query, categoryId, products = SYNTHETIC_PRODUCTS) {
  let filtered = [...products];

  if (categoryId) {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  }

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return filtered;
  }

  // Safe search normalization
  const rawQuery = query.trim().toLowerCase();
  const normalizedQuery = normalizeArabic(rawQuery);

  // Check Egyptian dialect mappings
  let dialectMatches = [];
  for (const [symptom, matchedSlugs] of Object.entries(DIALECT_MAPPINGS)) {
    const normSymptom = normalizeArabic(symptom);
    if (
      (normalizedQuery && (normalizedQuery.includes(normSymptom) || (normalizedQuery.length >= 2 && normSymptom.includes(normalizedQuery)))) ||
      (rawQuery && (rawQuery.includes(symptom.toLowerCase()) || (rawQuery.length >= 2 && symptom.toLowerCase().includes(rawQuery))))
    ) {
      dialectMatches.push(...matchedSlugs);
    }
  }

  return filtered.filter((product) => {
    // 1. Direct slug match from dialect
    if (dialectMatches.includes(product.slug)) return true;

    // 2. Exact or partial Arabic name match
    if (normalizeArabic(product.nameAr).includes(normalizedQuery)) return true;

    // 3. English name match
    if (product.nameEn.toLowerCase().includes(rawQuery)) return true;

    // 4. Active ingredient match
    if (
      normalizeArabic(product.activeIngredientAr || '').includes(normalizedQuery) ||
      (product.activeIngredientEn || '').toLowerCase().includes(rawQuery) ||
      (product.activeIngredient || '').toLowerCase().includes(rawQuery)
    ) {
      return true;
    }

    // 5. Description keywords
    if (normalizeArabic(product.descriptionAr || '').includes(normalizedQuery)) return true;

    // 6. Multi-token match for compound queries
    const arTokens = normalizedQuery.split(/\s+/).filter((t) => t.length >= 3);
    if (
      arTokens.length > 1 &&
      arTokens.some(
        (token) =>
          normalizeArabic(product.nameAr).includes(token) ||
          normalizeArabic(product.activeIngredientAr || '').includes(token)
      )
    ) {
      return true;
    }

    const enTokens = rawQuery.split(/\s+/).filter((t) => t.length >= 3);
    if (
      enTokens.length > 1 &&
      enTokens.some(
        (token) =>
          product.nameEn.toLowerCase().includes(token) ||
          (product.activeIngredientEn || '').toLowerCase().includes(token) ||
          (product.activeIngredient || '').toLowerCase().includes(token)
      )
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Schema and Regulatory Safety Validator
 */
export function validateProductSafety(product) {
  assert.ok(product, 'Product must not be null');
  assert.ok(product.id, 'Product ID is required');
  assert.ok(product.sku, 'Product SKU is required');
  assert.ok(product.slug, 'Product Slug is required');
  assert.ok(product.nameAr, 'Product nameAr is required');
  assert.ok(product.nameEn, 'Product nameEn is required');
  assert.ok(product.priceEgp > 0, `Price must be positive: got ${product.priceEgp}`);
  assert.strictEqual(product.isSynthetic, true, `Product ${product.id} must have isSynthetic: true`);
  assert.strictEqual(product.is_synthetic, true, `Product ${product.id} must have is_synthetic: true`);
  assert.strictEqual(product.maxOrderQuantity, 5, `Max order quantity must be capped at 5 for ${product.id}`);

  // Safety check: ensure no dangerous controlled substances are in synthetic catalog
  const bannedKeywords = ['tramadol', 'morphine', 'oxycodone', 'fentanyl', 'codeine', 'ترامادول', 'مورفين'];
  const textCorpus = `${product.nameAr} ${product.nameEn} ${product.activeIngredient}`.toLowerCase();
  for (const banned of bannedKeywords) {
    assert.ok(
      !textCorpus.includes(banned),
      `CRITICAL MEDICAL SAFETY: Product ${product.id} contains banned narcotic keyword "${banned}"`
    );
  }

  // Ensure disclaimer is present
  assert.ok(
    product.syntheticDisclaimerAr && product.syntheticDisclaimerAr.includes('تجريبية'),
    `Product ${product.id} must contain synthetic disclaimer in Arabic`
  );
}

/**
 * Mock Web Speech API Factory for SpeechRecognition testing
 */
export function createMockSpeechRecognition({
  supported = true,
  permissionGranted = true,
  transcriptToEmit = 'فوار حموضة',
  errorCodeToEmit = null
} = {}) {
  if (!supported) return null;

  return class MockSpeechRecognition {
    constructor() {
      this.lang = '';
      this.continuous = false;
      this.interimResults = false;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
    }

    start() {
      if (!permissionGranted) {
        setTimeout(() => {
          if (this.onerror) this.onerror({ error: errorCodeToEmit || 'not-allowed' });
          if (this.onend) this.onend();
        }, 5);
        return;
      }

      setTimeout(() => {
        if (this.onstart) this.onstart();

        setTimeout(() => {
          if (this.onresult) {
            this.onresult({
              results: [[{ transcript: transcriptToEmit }]]
            });
          }
          if (this.onend) this.onend();
        }, 10);
      }, 5);
    }

    stop() {
      if (this.onend) this.onend();
    }

    abort() {
      if (this.onend) this.onend();
    }
  };
}

/**
 * Voice Search Controller State Machine Simulation
 */
export function createVoiceSearchController({
  SpeechRecognitionClass,
  onQueryChange,
  onAutoSubmit
}) {
  let isListening = false;
  let statusMessage = 'جاهز';
  let errorMessage = '';
  let recognitionInstance = null;

  if (!SpeechRecognitionClass) {
    return {
      isSupported: false,
      start: () => {
        errorMessage = 'متصفحك لا يدعم خاصية البحث الصوتي';
      },
      getState: () => ({ isSupported: false, isListening: false, statusMessage, errorMessage })
    };
  }

  return {
    isSupported: true,
    start: () => {
      errorMessage = '';
      recognitionInstance = new SpeechRecognitionClass();
      recognitionInstance.lang = 'ar-EG';

      recognitionInstance.onstart = () => {
        isListening = true;
        statusMessage = 'بسمعك... اتكلم براحتك';
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onQueryChange) onQueryChange(transcript);
        if (onAutoSubmit) onAutoSubmit(transcript);
        statusMessage = 'تم التعرف على طلبك بدقة';
      };

      recognitionInstance.onerror = (event) => {
        isListening = false;
        if (event.error === 'not-allowed') {
          errorMessage = 'تم رفض إذن استخدام الميكروفون من المتصفح';
        } else {
          errorMessage = 'حدث خطأ أثناء الاستماع للصوت';
        }
      };

      recognitionInstance.onend = () => {
        isListening = false;
      };

      recognitionInstance.start();
    },
    getState: () => ({
      isSupported: true,
      isListening,
      statusMessage,
      errorMessage,
      instance: recognitionInstance
    })
  };
}

export { assert };
