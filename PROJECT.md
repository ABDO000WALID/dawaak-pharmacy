# Architectural Blueprint & Master Project Index: Egyptian Online Pharmacy (Phase 1)

## 1. Executive Summary & Architectural Overview

This project establishes the technical architecture, design system, specifications, and core interactive implementation of an online pharmacy tailored specifically to the Egyptian healthcare consumer and regulatory landscape.

Operating under a 7-role collaborative team model (Tech Lead, UI/UX Designer, Frontend Developer, Backend Developer, Pharmacy Domain Expert, Security & QA Engineer, Creative Innovator), the platform bridges traditional Egyptian apothecary trust ("صيدلية المنطقة") with modern, mobile-first e-commerce speed, transparent pricing in Egyptian Pounds (EGP / ج.م), and strict compliance with the Egyptian Drug Authority (EDA) and Personal Data Protection Law (151/2020).

### Core Architectural Pillars
- **Framework & Runtime**: Next.js 14/15 App Router with TypeScript (Strict Mode) and React Server Components (RSC) where appropriate, paired with reactive client islands.
- **Styling & Design System**: Tailwind CSS with RTL-first logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`), custom medical calming emerald/teal health palette, dark mode via Tailwind `class` strategy, and smooth non-intrusive CSS transitions.
- **Typography Strategy**: `Cairo` font for Arabic with vertical line-height compensation (`leading-relaxed` / `1.625`) to prevent diacritic clipping, paired with `Geist` / `Inter` for English pharmaceutical subtitles.
- **State Management**: Lightweight Zustand stores with SSR hydration safety guards and `localStorage` persistence for shopping cart items and language/direction preferences.
- **Data Architecture**: Decoupled domain service layer (`src/lib/services/product-service.ts`) backed by an in-memory synthetic pharmaceutical catalog (14 products) for zero-setup local execution, matching 1:1 with a production-grade 9-table PostgreSQL / Supabase relational schema.
- **Safety & Regulatory Compliance**: Strict synthetic active ingredient mandate (`is_synthetic: true`), permanent medical simulation disclaimers, zero hardcoded credentials, and Sensitive Personal Health Data protections.

---

## 2. Feature Inventory with Milestone Traceability

Every feature traces directly to the requirements in `ORIGINAL_REQUEST.md` (R1, R2, R3) and upstream surveys.

| # | Feature Name | Description | Milestone | R-Trace | Owner Role |
|---|---|---|---|---|---|
| **1** | **3 Egyptian Brand Name Proposals** | "دواك / Dawaak", "الأجزخانة / El-Agzakhana", "سلامتك / Salamtak" (and "شفاء أونلاين / Shefa Online") with cultural rationale, taglines, and SVG logo placeholders. | **M1** | R1 | UI/UX Designer / Tech Lead |
| **2** | **Egyptian Consumer Personas** | 3 authentic user personas: Hajj Ibrahim (Chronic patient), Mariam (Working mother), Karim (Elder guardian). | **M1** | R1 | Pharmacy Expert / UI/UX |
| **3** | **Full 8-Phase Roadmap** | Comprehensive enterprise roadmap from Phase 1 MVP to Phase 8 National Health Insurance Integration. | **M1** | R1 | Tech Lead / Domain Expert |
| **4** | **Target Database Schema (9 Tables)** | Complete PostgreSQL/Supabase DDL, enums, foreign keys, RLS policies, and performance indexes. | **M1** | R1 | Backend Developer |
| **5** | **Team Operations Log (7 Roles)** | Complete engineering log in `TEAM_LOG.md` recording decisions and contributions across all 7 mandated roles. | **M1** | R3 | Tech Lead (All Roles) |
| **6** | **E2E & Multi-Tier Test Suite** | Test infrastructure specification, Vitest unit tests, Playwright E2E scenarios, and test execution runner. | **M2** | R3 | Security & QA Engineer |
| **7** | **RTL / LTR Bi-directional Engine** | Arabic default layout (`dir="rtl"`, `lang="ar"`) with seamless dynamic English toggle (`dir="ltr"`) and logical properties. | **M3** | R2 | Frontend Developer |
| **8** | **Health Theme & Dark Mode System** | Calming medical emerald (`#0F766E`) and slate surfaces with high-contrast WCAG AA dark mode toggle. | **M3** | R2 | UI/UX Designer |
| **9** | **Mobile-First App Shell & Layout** | Sticky header with blur, ergonomic mobile bottom navigation bar (`BottomNav`), and safe-area padding. | **M3** | R2 | Frontend Developer |
| **10** | **Homepage Showcase View** | Hero trust banner ("صحتك أمانة"), 8-category carousel, promotional flash deals, and 2-column mobile product grid. | **M4** | R2 | Frontend Developer |
| **11** | **Product Details Page (PDP)** | Commercial names (AR/EN), synthetic active ingredient chip, EGP pricing, dosage accordions, warnings, and add to cart. | **M4** | R2 | Frontend Developer |
| **12** | **Sticky PDP Purchase Action Bar** | Sticky bottom purchase bar on PDP displaying price, quantity stepper, and "Add to Cart" button. | **M4** | R2 | Frontend / UI/UX |
| **13** | **Interactive Shopping Cart** | Mobile-first cart with quantity controls (max 5 limit), item removal, EGP subtotal, and dynamic free shipping bar. | **M4** | R2 | Frontend Developer |
| **14** | **Smart Egyptian Substitute Finder** | Creative Feature 1: Side-by-side equivalent generic comparison ("كاشف البديل الذكي ووفّر مع المصري"). | **M4** | R1, R2 | Creative Innovator / Frontend |
| **15** | **Interactive Dosage Schedule Preview**| Creative Feature 2: Dynamic daily pill organizer card (Morning, Noon, Night) with PDF print preview. | **M4** | R1, R2 | Creative Innovator / Frontend |
| **16** | **Egyptian Dialect Search with Voice Mock**| Creative Feature 3: Colloquial symptom keyword search ("دور باللي بتقوله") with animated Egyptian voice mock modal. | **M4** | R1, R2 | Creative Innovator / Frontend |
| **17** | **Zero-Secret & Security Verification** | Pre-commit secret scanning, `.env.example` baseline, private medical upload architecture. | **M5** | R3 | Security & QA Engineer |
| **18** | **Forensic Audit & Client Handoff** | Dual-track audit verification, `README.md` execution guide, and Phase 1 review presentation ("تمام كمّل"). | **M5** | R3 | Tech Lead / Auditor |

---

## 3. Project Milestones & Work Breakdown Structure

```
[M1: Specifications, Brand & Architecture] 
               │
               ▼
   [M2: Test Suite & QA Harness]
               │
               ▼
[M3: Foundation, Design Tokens & App Shell]
               │
               ▼
[M4: Core Pages, Zustand Store & Innovations]
               │
               ▼
 [M5: Dual-Track Audit & Client Verification]
```

### Milestone 1 (M1): Architecture, Specifications & Brand Proposals
- **Status**: IN PROGRESS (Current Milestone)
- **Primary Deliverables**: `PROJECT.md`, `SPEC.md`, `TEAM_LOG.md`
- **Scope**:
  - Author comprehensive architectural index and code layout.
  - Formulate 3 distinct Egyptian brand identities with SVG placeholders and color tokens.
  - Define 3 authentic Egyptian consumer personas.
  - Specify the full 8-phase implementation roadmap.
  - Author complete 9-table PostgreSQL / Supabase target schema with DDL, types, RLS, and indexes.
  - Define pharmacy domain logic (OTC vs Rx vs Schedule, generic equivalence, DDI warnings, synthetic safety).
  - Specify 3 Phase 1 creative innovations.
  - Initialize the 7-role engineering log in `TEAM_LOG.md`.

### Milestone 2 (M2): Test Infrastructure & QA Matrix
- **Status**: PLANNED (Pre-Implementation Harness)
- **Primary Deliverables**: `TEST_INFRA.md`, `TEST_READY.md`, test suites (`tests/unit/`, `tests/e2e/`)
- **Scope**:
  - Configure Vitest for unit arithmetic testing (EGP calculations, free shipping threshold, anti-hoarding caps).
  - Configure testing library for RTL layout rendering and dark mode transitions.
  - Define end-to-end test scenarios matching the acceptance criteria.

### Milestone 3 (M3): Application Foundation, Design System & App Shell
- **Status**: PLANNED
- **Primary Deliverables**: Next.js App Router scaffold, `tailwind.config.ts`, `Header.tsx`, `BottomNav.tsx`, `BrandLogo.tsx`, `useLocaleStore.ts`
- **Scope**:
  - Configure Next.js with Cairo & Geist fonts.
  - Establish medical emerald design tokens and dark mode class strategy.
  - Implement bidirectional RTL/LTR layout switcher with logical Tailwind classes.
  - Build responsive mobile header with search auto-suggest and language/theme toggles.
  - Implement mobile bottom navigation bar with thumb-zone touch targets.

### Milestone 4 (M4): Core Functional Views, State Management & Creative Features
- **Status**: PLANNED
- **Primary Deliverables**: `src/app/page.tsx` (Home), `src/app/product/[id]/page.tsx` (PDP), `src/app/cart/page.tsx` (Cart), `useCartStore.ts`, `products.ts` (14 synthetic items), Creative Components
- **Scope**:
  - Implement Homepage with hero trust banner, category chips, flash deals, and featured product grid.
  - Implement Product Details Page with dual-language names, synthetic active ingredient tag, dosage/warning accordions, and sticky purchase bar.
  - Implement Cart page with quantity adjustments, subtotal, delivery fee calculation, and empty state.
  - Implement 3 Creative Innovation features:
    1. Smart Substitute Finder drawer/modal.
    2. Interactive Dosage Schedule pill organizer preview.
    3. Egyptian Dialect Search bar with animated voice mock modal.

### Milestone 5 (M5): Dual-Track Forensic Audit, Documentation & Client Review
- **Status**: PLANNED
- **Primary Deliverables**: `README.md`, Forensic Audit report, Phase 1 Summary presentation
- **Scope**:
  - Execute full build (`npm run build`) and test suite verification.
  - Audit zero hardcoded secrets and synthetic medical data compliance.
  - Provide comprehensive `README.md` with local setup and verification commands.
  - Present Phase 1 completion summary to client for review and "تمام كمّل" approval.

---

## 4. Interface Contracts & Data Definitions

### 4.1 Product Domain Contract (`SyntheticProduct`)
```typescript
export interface SyntheticProduct {
  id: string;                         // Unique identifier (e.g. 'prod-syn-001')
  sku: string;                        // Stock keeping unit (e.g. 'EGY-SYN-001')
  slug: string;                       // URL-friendly slug (e.g. 'syntraphol-extra-500')
  nameAr: string;                     // Commercial Arabic name (e.g. 'سينترافول إكسترا 500 مجم')
  nameEn: string;                     // Commercial English name (e.g. 'Syntraphol Extra 500mg')
  categoryId: string;                 // e.g. 'analgesics-pain'
  activeIngredientAr: string;         // Strictly synthetic molecule in Arabic
  activeIngredientEn: string;         // Strictly synthetic molecule in English
  concentration: string;              // e.g. '500 mg'
  dosageForm: string;                 // 'Tablets' | 'Syrup' | 'Effervescent' | 'Gel'
  dosageFormAr: string;               // 'أقراص' | 'شراب' | 'فوار' | 'جل موضعي'
  packSize: string;                   // '20 Tablets (2 Strips)'
  packSizeAr: string;                 // '20 قرص (شريطين)'
  manufacturerAr: string;             // 'معامل فارما نايل مصر'
  manufacturerEn: string;             // 'PharmaNile Egypt Labs'
  priceEgp: number;                   // Retail price in EGP (e.g. 38.50)
  salePriceEgp?: number;              // Optional discounted price (e.g. 32.00)
  stockQuantity: number;              // Available warehouse inventory
  minOrderQuantity: number;           // Default: 1
  maxOrderQuantity: number;           // Anti-hoarding safety limit: 5
  prescriptionRequired: boolean;      // OTC (false) vs Prescription Only (true)
  storageConditionsAr: string;        // 'يحفظ في درجة حرارة أقل من 25 مئوية في مكان جاف'
  storageConditionsEn: string;        // 'Store below 25°C in a dry place'
  images: string[];                   // SVG/WebP placeholder URLs
  descriptionAr: string;              // Clinical indications in Arabic
  descriptionEn: string;              // Clinical indications in English
  dosageInstructionsAr: string;       // Usage instructions in Arabic
  dosageInstructionsEn: string;       // Usage instructions in English
  warningsAr: string[];               // Array of warning strings in Arabic
  warningsEn: string[];               // Array of warning strings in English
  substituteIds?: string[];           // IDs of bioequivalent synthetic alternatives
  isSynthetic: true;                  // Mandatory medical simulation flag
  syntheticDisclaimerAr: string;      // Standardized legal disclaimer in Arabic
  syntheticDisclaimerEn: string;      // Standardized legal disclaimer in English
  rating: number;                     // 1.0 - 5.0
  reviewsCount: number;
}
```

### 4.2 Cart State Contract (`CartStore`)
```typescript
export interface CartItem {
  product: SyntheticProduct;
  quantity: number;
}

export interface CartStore {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (status: boolean) => void;
  addItem: (product: SyntheticProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: (freeThreshold?: number, standardFee?: number) => number;
  getTotal: () => number;
  getItemCount: () => number;
}
```

### 4.3 Locale & Bi-directional State Contract (`LocaleStore`)
```typescript
export type Locale = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export interface LocaleStore {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}
```

### 4.4 Next.js API Route Contracts
1. **`GET /api/products`**
   - Query params: `category`, `search`, `prescription`, `sort`, `page`, `limit`.
   - Response: `{ success: true, count: number, total: number, data: SyntheticProduct[] }`.
2. **`GET /api/products/[slug]`**
   - Path parameter: `slug` (string).
   - Response: `{ success: true, data: SyntheticProduct }` or 404 `{ success: false, error: 'Product not found' }`.
3. **`POST /api/cart/validate`**
   - Request body: `{ items: { productId: string, quantity: number }[] }`.
   - Response: `{ success: true, isValid: boolean, subtotalEgp: number, deliveryFeeEgp: number, totalEgp: number, hasPrescriptionItems: boolean, prescriptionWarnings: string[] }`.

---

## 5. Master Code Layout & Directory Structure

```
c:\Desktop\صيدليه اونلاين\
├── .agents/                      # Teamwork agent metadata & handoffs
├── .env.example                  # Exhaustive baseline configuration template
├── .gitignore                    # Node modules, .next, .env.local, secrets exclusion
├── PROJECT.md                    # This master architecture and project index
├── SPEC.md                       # Comprehensive product specifications, brand & schema
├── TEAM_LOG.md                   # 7-role engineering decisions, contributions & audits
├── README.md                     # Setup, execution commands, and verification guide
├── package.json                  # Next.js 14/15, Tailwind, Zustand, Lucide React, Vitest
├── tsconfig.json                 # Strict TypeScript configuration
├── tailwind.config.ts            # Health palette, Cairo font, RTL logical rules
├── next.config.mjs               # Next.js App Router configuration
├── public/                       # Static public assets
│   ├── favicon.ico
│   ├── placeholders/             # Synthetic pharmaceutical SVG placeholders
│   │   ├── syntraphol.svg
│   │   ├── pharmacure.svg
│   │   ├── egyptocalm.svg
│   │   └── default-medicine.svg
│   └── logos/                    # Brand logo SVG variations
│       ├── dawaak-logo.svg
│       ├── agzakhana-logo.svg
│       └── salamtak-logo.svg
└── src/
    ├── app/                      # Next.js App Router
    │   ├── layout.tsx            # Root layout with font injection, RTL provider
    │   ├── page.tsx              # Homepage (Hero, categories, promo, featured grid)
    │   ├── product/
    │   │   └── [id]/
    │   │       └── page.tsx      # Product Details Page (Details, warnings, sticky bar)
    │   ├── cart/
    │   │   └── page.tsx          # Interactive Cart Page (Items, subtotal, delivery)
    │   └── api/
    │       ├── products/
    │       │   ├── route.ts      # GET /api/products
    │       │   └── [slug]/
    │       │       └── route.ts  # GET /api/products/[slug]
    │       └── cart/
    │           └── validate/
    │               └── route.ts  # POST /api/cart/validate
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx        # Sticky header, search, lang toggle, theme toggle
    │   │   ├── BottomNav.tsx     # Mobile-first ergonomic 5-tab bottom navigation
    │   │   └── Footer.tsx        # Egyptian trust badges, MOH disclaimer, contacts
    │   ├── ui/
    │   │   ├── BrandLogo.tsx     # Vector SVG brand logo component
    │   │   ├── Button.tsx        # Accessible button with loading/variant states
    │   │   ├── Badge.tsx         # OTC, Rx, and Synthetic status badges
    │   │   ├── Accordion.tsx     # Smooth expandable clinical accordions
    │   │   ├── Modal.tsx         # Accessible overlay dialog component
    │   │   └── QuantityStepper.tsx # Rounded [- count +] with anti-hoarding limit
    │   ├── home/
    │   │   ├── HeroBanner.tsx    # Health trust hero with Egyptian call to action
    │   │   ├── CategoryChips.tsx # Horizontal scrollable category icons
    │   │   ├── PromoCarousel.tsx # Daily deals with discount savings badges
    │   │   └── DialectSearchMock.tsx # Colloquial search & voice modal mock
    │   ├── product/
    │   │   ├── ProductCard.tsx   # 2-column mobile card with active ingredient tag
    │   │   ├── ActiveIngredientTag.tsx # Distinct scientific molecule chip
    │   │   ├── StickyPurchaseBar.tsx # Sticky bottom purchase bar for PDP
    │   │   └── SubstituteFinderModal.tsx # Side-by-side generic equivalent comparison
    │   └── cart/
    │       ├── CartItemRow.tsx   # Item row with thumbnail, stepper, and EGP price
    │       ├── FreeShippingBar.tsx # Dynamic progress bar towards free shipping
    │       ├── OrderSummaryCard.tsx# Subtotal, delivery fee, and COD indicator
    │       └── DosageScheduleCard.tsx # Visual daily dosage schedule preview
    ├── lib/
    │   ├── mock-data/
    │   │   ├── products.ts       # 14 synthetic pharmaceutical products catalog
    │   │   ├── categories.ts     # 8 structured medical categories
    │   │   └── governorates.ts   # 27 Egyptian governorates & delivery fees
    │   ├── services/
    │   │   └── product-service.ts# In-memory query engine (search, filter, sort)
    │   ├── store/
    │   │   ├── useCartStore.ts   # Zustand cart store with localStorage persistence
    │   │   └── useLocaleStore.ts # Bidirectional RTL/LTR & language store
    │   └── utils/
    │       ├── currency.ts       # Egyptian Pound (EGP / ج.م) currency formatter
    │       └── cn.ts             # Tailwind class merging utility (clsx + twMerge)
    ├── types/
    │   ├── database.ts           # 9-table Supabase schema mirror & enums
    │   ├── product.ts            # SyntheticProduct & Category interfaces
    │   ├── cart.ts               # CartItem & CartStore interfaces
    │   └── common.ts             # Locale, Direction, Governorate types
    └── tests/
        ├── unit/
        │   ├── cart-math.test.ts # Subtotal, delivery fee, and discount assertions
        │   ├── currency.test.ts  # Egyptian currency formatting tests
        │   └── synthetic-guard.test.ts # Validates isSynthetic === true across catalog
        └── e2e/
            └── user-flows.spec.ts# Playwright E2E scenarios for Home, PDP, and Cart
```

---

## 6. Governance, Safety & Integrity Mandates

1. **Absolute Integrity Mandate**:
   - No hardcoded test results, fake green checks, or dummy facades.
   - All components maintain authentic internal state and produce genuine interactions.
2. **Medical Safety & Synthetic Mandate**:
   - Zero invented claims for real chemical drugs.
   - All pharmaceuticals in Phase 1 use the prefix `Syntho-` or synthetic naming convention with `is_synthetic: true`.
   - Every page features a conspicuous disclaimer: *"بيانات دوائية تجريبية لأغراض المحاكاة والتطوير فقط"*.
3. **Egyptian Privacy (Law 151/2020) & Security**:
   - Health data (prescriptions, chronic conditions) is classified as Sensitive Personal Data.
   - Zero hardcoded secrets in source files (.env.example only).
   - Prescriptions stored in private encrypted storage with short-lived presigned URLs (TTL 15 min).
4. **Phase 1 Completion Boundary**:
   - Stop immediately upon Phase 1 completion and present the comprehensive summary to the client for "تمام كمّل" approval.
