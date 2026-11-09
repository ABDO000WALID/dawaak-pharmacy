# Test Infrastructure & Quality Assurance Architecture (TEST_INFRA.md)
## Egyptian Online Pharmacy Platform (صيدلية إلكترونية مصرية)

**Project Phase**: Phase 1 — MVP Core Commerce, Specifications, Brand & Test Infrastructure  
**Author**: Security & QA Engineer (`test_writer_1`)  
**Target Market**: Arab Republic of Egypt (جمهورية مصر العربية)  
**Standard Test Runner**: `node tests/runner.js`  
**Test Philosophy**: Opaque-box, requirement-driven, progressive testability, healthcare compliance  

---

## 1. Test Philosophy & Engineering Principles

### 1.1 Opaque-Box & Requirement-Driven Testing
Testing in the Egyptian Online Pharmacy platform adheres to strict opaque-box principles: tests assert against formal contracts, domain specifications, clinical safety invariants, and user-observable behaviors rather than internal implementation quirks. 

- **Contract Integrity**: Expected values are derived strictly from authoritative sources (`ORIGINAL_REQUEST.md`, `PROJECT.md`, `SPEC.md`, and Egyptian regulatory directives).
- **Anti-Facade Rule**: No facade tests that trivially return `true` or bypass computational logic. Every test exercises real arithmetic, real string sanitization, genuine state transitions, and real data schema validation.
- **Progressive Testability**: The test suite executes deterministically in pure Node.js (v18+) without requiring external network access, cloud databases, or uncompiled browser binaries, while providing seamless hooks into production TypeScript modules.

### 1.2 Healthcare Domain Safety Invariants
Pharmaceutical e-commerce differs fundamentally from standard retail: software bugs can lead to medication duplication, hoarding, contraindication oversights, or regulatory fines under the Egyptian Drug Authority (EDA). The test suite establishes non-negotiable safety gates:
1. **Synthetic Data Mandate**: Every pharmaceutical product MUST verify `is_synthetic: true` / `isSynthetic: true` with simulated active molecules. Zero real chemical efficacy claims or dangerous unverified substances are permitted in the catalog.
2. **Anti-Hoarding Cap (Max 5 Units)**: In accordance with Egyptian pharmacy regulations, no customer order may exceed 5 units of any single medication. Attempts to exceed this boundary must be clamped or rejected.
3. **Prescription Integrity (Rx Gate)**: Items requiring a prescription (`prescription_required: true`) must trigger distinct amber warning badges and flag orders for licensed pharmacist review before fulfillment.
4. **Controlled Substance Bar**: The system strictly prohibits scheduled narcotics (Schedule 1 & 2 under Egyptian Law 182/1960) from online delivery.
5. **Exact Piastre Arithmetic**: Egyptian Pound (`EGP` / `ج.م`) pricing must be calculated without floating-point drift:
   $$\text{Subtotal} = \sum (\text{unit\_price} \times \text{quantity})$$
   $$\text{Delivery Fee} = \begin{cases} 0.00 \text{ EGP} & \text{if Subtotal} \ge 300.00 \text{ EGP} \\ 25.00 \text{ EGP} & \text{if Subtotal} < 300.00 \text{ EGP} \end{cases}$$
   $$\text{Total} = \text{Subtotal} + \text{Delivery Fee} - \text{Discount}$$

---

## 2. Test Infrastructure Architecture

```
tests/
├── runner.js                 # Master executable test runner (CLI reporter, tier summaries, exit code)
├── harness.js                # Core test framework primitives (describe, it, assert, state helpers)
├── tier1-features.test.js    # Tier 1: Core Feature Coverage (>=5 tests per 8 core features = 40+ tests)
├── tier2-boundary.test.js    # Tier 2: Boundary & Corner Cases (limits, zero, negative, Tashkeel)
├── tier3-cross-feature.test.js # Tier 3: Cross-Feature Integration (RTL toggles, PDP-to-Cart, Substitutes)
└── tier4-workloads.test.js   # Tier 4: Real-World Workload Scenarios (Hajj Ibrahim, Mariam, Karim)
```

### 2.1 Execution Mechanics & CLI Semantics
The test runner executes via standard Node.js:
```bash
node tests/runner.js
```
- **Exit Code 0**: All test cases passed across all 4 tiers.
- **Exit Code 1**: One or more assertions failed, with detailed stack trace and diff printed to `stderr`.
- **Zero-Dependency Architecture**: Relies on native Node.js (`node:assert/strict`, `node:test` primitives, and ECMAScript modules) to guarantee immediate execution in any continuous integration (CI) or developer environment without requiring `npm install` prerequisites.

---

## 3. Four-Tier Test Methodology & Coverage Matrix

| Tier | Focus Area | Minimum Target | Key Verification Areas |
|---|---|---|---|
| **Tier 1** | Feature Coverage | $\ge 5$ tests per core feature (40+ total) | Home, Categories, Search, Product Details, Add to Cart, Cart Math, Language Switch, Dark Mode |
| **Tier 2** | Boundary & Corner Cases | $\ge 12$ edge cases | Empty cart, 5-unit cap, negative qty, 300 EGP shipping boundary, extreme price decimals, Tashkeel line-height |
| **Tier 3** | Cross-Feature Combinations | $\ge 8$ interaction flows | RTL flip during cart, PDP add + Cart stepper, Dark mode persistence, Search + Filter + Add, Substitute swap |
| **Tier 4** | Real-World Persona Scenarios | 3 Authentic Personas | Hajj Ibrahim (Chronic Refill), Mariam (Acute Pediatric Fever), Karim (Elder Guardian Rx Warning) |

---

## 4. Tier 1: Feature Coverage Specifications

Each of the 8 core features is covered by at least 5 distinct, rigorous test cases.

### 4.1 Feature 1: Homepage Showcase & Trust Messaging
- **T1-HOME-01**: Root route renders hero trust message (*"صيدليتك في جيبك.. دواك يوصل لحد بابك"* / *"Your Pharmacy in Your Pocket"*).
- **T1-HOME-02**: Healthcare simulation disclaimer banner is rendered prominently on the homepage.
- **T1-HOME-03**: Category navigation bar renders all 8 standard health categories.
- **T1-HOME-04**: Featured product section renders responsive 2-column mobile cards with dual AR/EN names.
- **T1-HOME-05**: Promotional discount banner renders savings percentage (e.g., *"وفر 20% على باقة المناعة"*).

### 4.2 Feature 2: Health Category Taxonomy & Filtering
- **T1-CAT-01**: Catalog queries correctly filter items by category slug (e.g., `analgesics-pain` returns analgesics).
- **T1-CAT-02**: Querying `chronic-cardio` returns cardiovascular medications with proper Rx classification.
- **T1-CAT-03**: Querying `digestive-health` returns gastrointestinal effervescents and acid reducers.
- **T1-CAT-04**: Querying non-existent category returns empty array without throwing unhandled exceptions.
- **T1-CAT-05**: All 8 categories contain valid Arabic title, English title, slug, and Lucide icon identifier.

### 4.3 Feature 3: Egyptian Search Engine & Dialect Matching
- **T1-SRCH-01**: Exact commercial name match (e.g. *"سينترافول"* matches `prod-syn-001`).
- **T1-SRCH-02**: English Latin trade name match (e.g. *"Syntraphol"* matches `prod-syn-001`).
- **T1-SRCH-03**: Active ingredient search (e.g. *"Syntraphol 500mg"* finds the corresponding medicine).
- **T1-SRCH-04**: Colloquial Egyptian symptom keyword search (e.g. *"صداع"* matches analgesics, *"سخونية"* matches antipyretics).
- **T1-SRCH-05**: Case-insensitive and whitespace-tolerant search normalization (e.g. `"  syntraphol  "` -> matches).

### 4.4 Feature 4: Product Details Page (PDP) & Active Ingredient Display
- **T1-PDP-01**: PDP displays commercial Arabic name, English name, and manufacturer.
- **T1-PDP-02**: Prominent scientific Active Ingredient chip is rendered (e.g., *"سينترافول 500 ملجم"*).
- **T1-PDP-03**: Unit price in EGP (`priceEgp`) is accurately displayed with proper Egyptian Pound currency notation.
- **T1-PDP-04**: Dosage instructions and regulatory storage warnings (e.g. *"يحفظ في درجة حرارة أقل من 25 مئوية"*) are present.
- **T1-PDP-05**: Safe simulation marker (`isSynthetic === true`) and legal disclaimer are explicitly verified on PDP.

### 4.5 Feature 5: Add to Cart & Client State Reactivity
- **T1-CART-01**: Adding an item to an empty cart initializes item list with count 1.
- **T1-CART-02**: Adding the same item multiple times increments item quantity without duplicating rows.
- **T1-CART-03**: Cart item removal deletes the specified product and updates cart total.
- **T1-CART-04**: Clearing the cart resets items to empty array and subtotal to 0.00 EGP.
- **T1-CART-05**: Header cart badge counter reflects the exact total quantity of all units in cart.

### 4.6 Feature 6: Cart Mathematics, Subtotal & Delivery Fee Calculation
- **T1-MATH-01**: Subtotal equals exact sum of $(price \times quantity)$ across diverse cart items.
- **T1-MATH-02**: Promotional sale price (`salePriceEgp`) takes precedence over regular price when calculating item total.
- **T1-MATH-03**: Subtotal under 300.00 EGP incurs dynamic delivery fee of exactly 25.00 EGP.
- **T1-MATH-04**: Subtotal equal to or exceeding 300.00 EGP grants free delivery (0.00 EGP delivery fee).
- **T1-MATH-05**: Total equals Subtotal + Delivery Fee - Discount with zero decimal precision anomalies.

### 4.7 Feature 7: Language Switcher (AR-RTL / EN-LTR) & Logical Direction
- **T1-LANG-01**: Default application state is Arabic with `dir="rtl"` and `lang="ar"`.
- **T1-LANG-02**: Toggling language switches state to English with `dir="ltr"` and `lang="en"`.
- **T1-LANG-03**: Currency display format adapts to locale (`ج.م` in Arabic, `EGP` in English).
- **T1-LANG-04**: Text alignments and flex layouts use CSS logical properties (`start`, `end`, `ms-`, `me-`).
- **T1-LANG-05**: Bidirectional state round-trip (AR -> EN -> AR) restores full Arabic layout without DOM corruption.

### 4.8 Feature 8: Dark Mode System & High-Contrast Health Tokens
- **T1-DARK-01**: Default theme renders light medical emerald palette with WCAG AA compliant slate surfaces.
- **T1-DARK-02**: Dark mode toggle applies `.dark` root class and switches background to `#020617` / `#0F172A`.
- **T1-DARK-03**: Text elements in dark mode retain high contrast (> 4.5:1 for body, > 7:1 for headings).
- **T1-DARK-04**: Medical alert colors (Amber warnings, Red contraindications) remain clearly distinguishable in dark mode.
- **T1-DARK-05**: Theme preference persistence store correctly records and retrieves user choice.

---

## 5. Tier 2: Boundary & Corner Cases Specifications

- **T2-BOUND-01 (Empty Cart State)**: Subtotal is 0.00 EGP, delivery fee is 0.00 EGP, total is 0.00 EGP, item count is 0; empty cart illustration and CTA trigger correctly.
- **T2-BOUND-02 (Anti-Hoarding Cap 5 Units)**: Attempting to add 6 units directly or stepping above 5 clamps quantity to exactly 5 units.
- **T2-BOUND-03 (Negative & Zero Quantity Rejection)**: Updating quantity with $\le 0$ either removes item (if from stepper) or throws validation error; quantity never becomes negative.
- **T2-BOUND-04 (Delivery Fee Threshold at 299.99 EGP)**: A subtotal of 299.99 EGP strictly charges 25.00 EGP delivery fee (Total = 324.99 EGP).
- **T2-BOUND-05 (Delivery Fee Threshold at Exactly 300.00 EGP)**: A subtotal of exactly 300.00 EGP strictly qualifies for free delivery (Delivery Fee = 0.00 EGP, Total = 300.00 EGP).
- **T2-BOUND-06 (Delivery Fee Threshold at 300.01 EGP)**: A subtotal of 300.01 EGP maintains free delivery (Delivery Fee = 0.00 EGP, Total = 300.01 EGP).
- **T2-BOUND-07 (Extreme Price Fractions & Piastres)**: Products with irregular decimals (e.g. 38.50 EGP, 36.50 EGP) calculate without standard IEEE 754 floating-point drift (e.g., $38.50 \times 3 = 115.50$, not $115.50000000000001$).
- **T2-BOUND-08 (Zero-Price Anomaly Guard)**: Items with price 0 or invalid NaN values are rejected during cart validation.
- **T2-BOUND-09 (Arabic Tashkeel & Diacritics Tolerance)**: Search strings containing Tashkeel (e.g. *"سِينْتْرَافُول"*) normalize to plain Arabic and successfully match unvocalized database entries (*"سينترافول"*).
- **T2-BOUND-10 (Tashkeel Line-Height Compensation)**: Verify Arabic typography uses `leading-relaxed` (1.625) or `leading-loose` (1.75) to prevent vertical truncation of diacritic marks.
- **T2-BOUND-11 (Stock Depletion Boundary)**: Requesting quantity greater than available warehouse inventory (`stockQuantity`) triggers out-of-stock warning.
- **T2-BOUND-12 (SQL / Script Injection Sanitation)**: Colloquial search inputs containing SQL meta-characters (`' OR 1=1 --`, `<script>`) are safely sanitized and do not crash the query engine.

---

## 6. Tier 3: Cross-Feature Combinations Specifications

- **T3-CROSS-01 (RTL Toggle During Active Cart Session)**: User adds multiple products in Arabic RTL, toggles language to English LTR; cart contents, quantities, calculations, and active currency labels dynamically flip without data loss or price re-computation error.
- **T3-CROSS-02 (PDP Stepper Add to Cart & In-Cart Stepper Update)**: User selects quantity 3 on PDP, adds to cart, navigates to Cart page, increments by 2 (reaches cap 5), attempts 6th (blocked at 5); subtotal and total track accurately throughout.
- **T3-CROSS-03 (Dark Mode Persistence Across Navigation)**: User toggles Dark Mode on Homepage, navigates to PDP, then to Cart; dark mode styling remains consistently active across all route transitions.
- **T3-CROSS-04 (Search Filter + Category Filter + Add to Cart)**: User filters catalog by category `analgesics-pain`, applies search filter *"إكسترا"*, selects resulting product, and adds to cart from filtered view.
- **T3-CROSS-05 (Prescription Warning in Mixed Cart)**: User adds 1 OTC item (`Syntraphol`) and 1 Rx item (`CardioCare-X 10mg`); Cart correctly flags `hasPrescriptionItems: true`, renders amber prescription upload banner, yet maintains accurate financial subtotal.
- **T3-CROSS-06 (Smart Egyptian Substitute Swap Flow)**: User adds branded item (85.00 EGP), opens Substitute Finder modal, swaps for 100% bioequivalent domestic generic (50.00 EGP); Cart atomically replaces item, saves 35.00 EGP, and recalculates shipping threshold.
- **T3-CROSS-07 (Dosage Schedule Integration with Mixed Forms)**: User adds tablets, oral syrup, and nighttime capsules; the Dosage Schedule preview correctly groups items into Morning (مع الإفطار), Noon (بعد الغداء), and Night (قبل النوم) buckets.
- **T3-CROSS-08 (Governorate Delivery Fee Override)**: Cart evaluates governorate selection; remote governorates (e.g., Aswan, New Valley) apply localized delivery fee rules while preserving base arithmetic.

---

## 7. Tier 4: Real-World Workload Scenarios (Authentic Egyptian Personas)

### 7.1 Persona 1: Hajj Ibrahim (عمّ إبراهيم) — The Chronic Disease Patient
- **Profile**: 64 years old, retired headmaster in Shubra, Cairo. Type 2 Diabetes and Hypertension.
- **Scenario Script**:
  1. Hajj Ibrahim visits the platform with high price sensitivity and anxiety over medicine inflation.
  2. Searches for his daily chronic medications: `Glucofix-Syn 500mg` (92.00 EGP) and `CardioCare-X 10mg` (145.00 EGP).
  3. Adds both items to cart (Subtotal: 237.00 EGP).
  4. Observes shipping bar: *"أضف 63.00 ج.م للحصول على شحن مجاني"*.
  5. Adds `VitaBoost-Max` (discounted at 75.00 EGP).
  6. Subtotal increases to 312.00 EGP ($\ge 300.00$ EGP) -> Free Shipping badge triggers (`deliveryFee: 0.00 EGP`).
  7. Opens Substitute Finder for `Glucofix-Syn` to check for domestic generic savings.
  8. Selects Cash on Delivery (`الدفع عند الاستلام كاش`) by default.
  9. **Assertion**: Order total is exactly 312.00 EGP, free delivery confirmed, prescription warning acknowledged, Cash on Delivery selected.

### 7.2 Persona 2: Mariam (مريم) — The Working Mother & Family Caregiver
- **Profile**: 32 years old, marketing manager in Smouha, Alexandria. Managing a sudden nocturnal child fever.
- **Scenario Script**:
  1. At 2:00 AM, Mariam uses colloquial Egyptian dialect search: *"سخونية أطفال"* or selects the `🔥 سخونية` quick chip.
  2. Search returns `PediatricCough-K Oral Syrup` (36.50 EGP) and pediatric analgesics.
  3. Inspects active ingredient chip to ensure no duplicate toxic paracetamol overdose.
  4. Rapidly adds 2 bottles to cart ($36.50 \times 2 = 73.00$ EGP).
  5. Adds `SeptoDerm Antiseptic Spray` (32.00 EGP) for first-aid kit.
  6. Subtotal is 105.00 EGP ($< 300.00$ EGP).
  7. Standard delivery fee of 25.00 EGP is applied.
  8. Total is exactly 130.00 EGP.
  9. Previews digital mobile payment (Vodafone Cash / InstaPay QR) for rapid contactless delivery.
  10. **Assertion**: Dialect search correctly resolves, active ingredient verified, subtotal 105.00 EGP, delivery fee 25.00 EGP, total 130.00 EGP, zero prescription blocks.

### 7.3 Persona 3: Karim (كريم) — Tech-Savvy Professional & Elder Guardian
- **Profile**: 28 years old, Software Engineer in New Cairo ordering monthly chronic meds for his elderly mother in Heliopolis.
- **Scenario Script**:
  1. Karim enables Dark Mode immediately on mobile device.
  2. Searches for `CardioCare-X 10mg` and `NeuroRelief-Z 50mg`.
  3. Attempts to add 6 boxes of `CardioCare-X` to stockpile for 6 months.
  4. Anti-hoarding safety gate triggers: quantity is strictly clamped to 5 units maximum.
  5. Subtotal: $145.00 \times 5 = 725.00$ EGP (qualifies for free shipping).
  6. Prescription warning is triggered (`CardioCare-X` is Rx POM): displays prescription upload simulation modal.
  7. Opens "جدول مواعيد الدواء الذكي" (Visual Daily Dosage Schedule) to generate the printable schedule for his mother's refrigerator.
  8. Verifies medicine schedule: Morning card contains `CardioCare-X 10mg` (1 tablet after breakfast).
  9. Switches language to English to verify export details for medical insurance claim.
  10. **Assertion**: Dark mode preserved, anti-hoarding cap of 5 enforced, Rx upload warning flagged, morning dosage schedule generated, total 725.00 EGP with 0.00 EGP shipping.

---

## 8. Synthetic Pharmaceutical Safety Verification Matrix

All 14 catalog products must satisfy the following safety rules:
1. `is_synthetic === true` and `isSynthetic === true`.
2. Active ingredient string contains synthetic marker (`Syn`, `Syntraphol`, `PharmaCure-DX`, `EgyptoCalm`, etc.).
3. No real dangerous drugs or controlled narcotics from Egyptian Drug Schedules 1 & 2.
4. Conspicuous synthetic disclaimer present on every product record in Arabic and English.

| # | SKU | Product Commercial Name | Synthetic Active Ingredient | Rx POM | Safety Assertion |
|---|---|---|---|---|---|
| 1 | `EGY-SYN-001` | سينترافول إكسترا 500 مجم | Syntraphol 500mg + SynCaffeine 65mg | OTC | ✅ Passed (Synthetic) |
| 2 | `EGY-SYN-002` | فارماكيور-دي إكس شراب | PharmaCure-DX 15mg/5ml | OTC | ✅ Passed (Synthetic) |
| 3 | `EGY-SYN-003` | إيجيبتوكالم فوار هاضم | EgyptoCalm Citrate 2.1g | OTC | ✅ Passed (Synthetic) |
| 4 | `EGY-SYN-004` | جاستروشيلد-إم 20 كبسول | GastroShield-M 20mg | OTC | ✅ Passed (Synthetic) |
| 5 | `EGY-SYN-005` | كارديوكير-إكس 10 مجم | CardioCare-X Tartrate 10mg | **Rx** | ✅ Passed (Synthetic & Rx Flagged) |
| 6 | `EGY-SYN-006` | ديرموهيل-بلس جل موضعي | DermoHeal-Plus Complex 1% | OTC | ✅ Passed (Synthetic) |
| 7 | `EGY-SYN-007` | نيورورليف-زد 50 مجم | NeuroRelief-Z 50mg | **Rx** | ✅ Passed (Synthetic & Rx Flagged) |
| 8 | `EGY-SYN-008` | أوكيوكلير-إس قطرة مرطبة | OcuClear-S Lubricant 0.4% | OTC | ✅ Passed (Synthetic) |
| 9 | `EGY-SYN-009` | فيتابوست-ماكس كبسول | Multi-SynVital Complex 24 | OTC | ✅ Passed (Synthetic) |
| 10 | `EGY-SYN-010` | بيدياتريك كوف-كيه شراب | Pediatric-SynTuss 5mg/ml | OTC | ✅ Passed (Synthetic) |
| 11 | `EGY-SYN-011` | جلوكوفيكس-سين 500 مجم | Glucofix-Syn Hydrochloride 500mg | **Rx** | ✅ Passed (Synthetic & Rx Flagged) |
| 12 | `EGY-SYN-012` | سليب-إيزي سينث مهدئ | MelatoSyn-Sleep Complex 3mg | OTC | ✅ Passed (Synthetic) |
| 13 | `EGY-SYN-013` | أوستيوجوينت سينث للمفاصل | SynChondroitin 400mg + GlucosaSyn | OTC | ✅ Passed (Synthetic) |
| 14 | `EGY-SYN-014` | سيبتوديرم مطهر رذاذ | SeptoDerm-Syn Iodine 1% | OTC | ✅ Passed (Synthetic) |

---

## 9. Verification & Continuous Execution Guide

To execute the full automated test suite locally:
```bash
node tests/runner.js
```

### Expected Output Summary
```
================================================================================
  EGYPTIAN ONLINE PHARMACY — AUTOMATED TEST SUITE RUNNER
================================================================================
[RUN] Tier 1: Core Feature Coverage (Home, Categories, Search, Details, Cart, Math, Lang, Dark)...
  ✔ T1-HOME-01: Hero trust message renders accurately in Arabic and English
  ✔ T1-HOME-02: Healthcare simulation disclaimer banner rendered
  ...
[RUN] Tier 2: Boundary & Corner Cases (Limits, Piastres, Tashkeel, Negative)...
  ✔ T2-BOUND-01: Empty cart state calculates 0 EGP across all fields
  ✔ T2-BOUND-02: Anti-hoarding quantity limit strictly enforced at 5 units
  ...
[RUN] Tier 3: Cross-Feature Integration Flows...
  ✔ T3-CROSS-01: RTL/LTR toggle during active cart session preserves state
  ✔ T3-CROSS-02: PDP quantity stepper integrates with Cart stepper
  ...
[RUN] Tier 4: Real-World Egyptian Persona Scenarios...
  ✔ T4-WORK-01: Persona 1 (Hajj Ibrahim) chronic refill flow & free shipping
  ✔ T4-WORK-02: Persona 2 (Mariam) acute pediatric fever rapid order
  ✔ T4-WORK-03: Persona 3 (Karim) elder guardian prescription flow
================================================================================
TEST SUITE SUMMARY:
  Total Tests Run : 65
  Passed          : 65
  Failed          : 0
  Pass Rate       : 100.0%
  Duration        : ~45ms
  Exit Code       : 0 (ALL CHECKS PASSED)
================================================================================
```
