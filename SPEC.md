# Product Specification Document (SPEC.md): Egyptian Online Pharmacy

**Version**: 1.0.0 (Phase 1 Foundation & Architecture)  
**Target Market**: Arab Republic of Egypt (جمهورية مصر العربية)  
**Primary Currency**: Egyptian Pound (EGP / ج.م)  
**Default Language & Direction**: Arabic (RTL) with dynamic English (LTR) toggle  
**Status**: Approved Specification Baseline  

---

## 1. Brand Naming & Visual Identity System

To resonate authentically with Egyptian healthcare consumers while projecting clinical excellence, modern digital efficiency, and deep cultural warmth, three distinct brand name options have been formulated. A fourth institutional brand ("شفاء أونلاين / Shefa Online") serves as an alternative clinical baseline.

### 1.1 Brand Option 1: "دواك" (Dawaak / Dawaak Online Pharmacy)
- **Primary Arabic Slogan**: *"صيدليتك في جيبك.. دواك يوصل لحد بابك"*
- **Primary English Slogan**: *"Your Pharmacy in Your Pocket.. Your Medicine at Your Door."*
- **Cultural Resonance & Etymology**:  
  "دواك" (Your Medicine / Your Remedy) is the most natural, conversational, and caring Egyptian word exchanged when someone is unwell ("لقيت دواك؟", "دواك عندنا"). It feels personal, warm, and immediate.
- **Brand Personality**: Dynamic, mobile-first, fast, accessible, and protective.
- **Color Palette**:
  - Primary: Energetic Medical Emerald (`#00A86B`)
  - Secondary: Deep Healing Teal (`#0F766E`)
  - Accent: Vital Mint (`#10B981`)
  - Background Neutral: Pure Slate (`#F8FAFC`) / Dark Mode (`#020617`)
- **Standalone SVG Brand Logo**:
```xml
<svg viewBox="0 0 170 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-10 w-auto">
  <!-- Rounded Shield Emblem -->
  <rect x="2" y="2" width="44" height="44" rx="12" fill="#00A86B" />
  <!-- Medical Cross & Caring Heart Silhouette -->
  <path d="M24 13V35M13 24H35" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="31" cy="17" r="4" fill="#34D399" />
  <!-- Dual Typography -->
  <text x="56" y="24" font-family="Cairo, sans-serif" font-weight="800" font-size="18" fill="#00A86B">دواك</text>
  <text x="56" y="38" font-family="Inter, sans-serif" font-weight="600" font-size="10" fill="#64748B" letter-spacing="1.2">DAWAAK PHARMACY</text>
</svg>
```

---

### 1.2 Brand Option 2: "الأجزخانة" (El-Agzakhana / Agzakhana Digital)
- **Primary Arabic Slogan**: *"أصل الصيدلة بروح مصرية ورعاية عصرية"*
- **Primary English Slogan**: *"The Authentic Pharmacy Heritage with Modern Egyptian Care."*
- **Cultural Resonance & Etymology**:  
  "الأجزخانة" is the cherished historical Egyptian term for the apothecary dating back over a century. In Egyptian cultural memory, it embodies the wise, beloved family pharmacist who knows every neighbor, compounds cures with utmost integrity, and protects families from counterfeit drugs.
- **Brand Personality**: Authoritative, deeply trusted, prestigious, and clinically rigorous.
- **Color Palette**:
  - Primary: Royal Apothecary Teal (`#005F73`)
  - Secondary: Egyptian Amber Gold (`#EE9B00`)
  - Accent: Sage Green (`#94D2BD`)
  - Background Neutral: Warm Cream Slate (`#F8FAFC`)
- **Standalone SVG Brand Logo**:
```xml
<svg viewBox="0 0 190 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-10 w-auto">
  <!-- Vintage Apothecary Mortar & Modern Shield -->
  <rect x="2" y="2" width="44" height="44" rx="10" fill="#005F73" />
  <path d="M14 20C14 27 18 32 24 32C30 32 34 27 34 20H14Z" fill="#EE9B00"/>
  <path d="M21 12L28 22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  <circle cx="24" cy="14" r="2.5" fill="#FFFFFF"/>
  <!-- Typography -->
  <text x="56" y="24" font-family="Cairo, sans-serif" font-weight="800" font-size="17" fill="#005F73">الأجزخانة</text>
  <text x="56" y="38" font-family="Inter, sans-serif" font-weight="600" font-size="9.5" fill="#B45309" letter-spacing="0.8">EL-AGZAKHANA DIGITAL</text>
</svg>
```

---

### 1.3 Brand Option 3: "سلامتك" (Salamtak / Salamtak Pharmacy)
- **Primary Arabic Slogan**: *"صحتك وسلامتك.. أولويتنا دايماً"*
- **Primary English Slogan**: *"Your Health and Safety.. Always Our First Priority."*
- **Cultural Resonance & Etymology**:  
  "سلامتك" is the quintessential Egyptian expression of empathy, healing, and warmth exchanged whenever someone falls ill ("ألف سلامة عليك يا غالي"). It immediately creates an emotional bond of caring and safety.
- **Brand Personality**: Empathetic, soothing, family-oriented, and community-driven.
- **Color Palette**:
  - Primary: Calming Medical Azure (`#0284C7`)
  - Secondary: Vital Mint Green (`#10B981`)
  - Accent: Sky Blue (`#38BDF8`)
  - Background Neutral: Fresh White (`#FFFFFF`) / Slate (`#0F172A`)
- **Standalone SVG Brand Logo**:
```xml
<svg viewBox="0 0 170 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-10 w-auto">
  <rect x="2" y="2" width="44" height="44" rx="14" fill="#0284C7" />
  <!-- Protective Hands / Healing Cross -->
  <path d="M24 14V34M14 24H34" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  <path d="M17 31C20 34 28 34 31 31" stroke="#34D399" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Typography -->
  <text x="56" y="24" font-family="Cairo, sans-serif" font-weight="800" font-size="18" fill="#0284C7">سلامتك</text>
  <text x="56" y="38" font-family="Inter, sans-serif" font-weight="600" font-size="10" fill="#0D9488" letter-spacing="1">SALAMTAK PHARMACY</text>
</svg>
```

---

### 1.4 Alternative Option: "شفاء أونلاين" (Shefa Online)
- **Arabic Slogan**: *"صحتك أمانة، ودواك لحد باب بيتك"*
- **Visual Concept**: Modern medical cross morphing into a vibrant green healing leaf.
- **Palette**: Medical Emerald (`#0F766E`), Mint (`#10B981`), Crisp Slate (`#F8FAFC`).

---

### 1.5 Design System Tokens & CSS Specifications

| Design Token | Light Mode Value | Dark Mode Value | Semantic Role | WCAG Ratio |
|---|---|---|---|---|
| `--color-primary` | `#0F766E` (`teal-700`) | `#2DD4BF` (`teal-400`) | Main actions, brand headers, active tabs | 7.4:1 (AAA) |
| `--color-primary-hover` | `#115E59` (`teal-800`) | `#14B8A6` (`teal-500`) | Hover & pressed interactive states | > 8.0:1 |
| `--color-primary-subtle`| `#F0FDFA` (`teal-50`) | `#134E4A` (`teal-900`/40) | Active pill tags, badge highlights | High contrast |
| `--color-secondary` | `#059669` (`emerald-600`) | `#34D399` (`emerald-400`)| OTC indicators, verified stamps, in-stock | 5.2:1 (AA) |
| `--color-accent-warm` | `#D97706` (`amber-600`) | `#FBBF24` (`amber-400`) | Warning dosage, prescription required, alerts | 4.8:1 (AA) |
| `--color-danger` | `#DC2626` (`red-600`) | `#F87171` (`red-400`) | Contraindications, allergy warnings, errors | 5.6:1 (AA) |
| `--color-surface-bg` | `#F8FAFC` (`slate-50`) | `#020617` (`slate-950`) | Global page background | Base |
| `--color-surface-card` | `#FFFFFF` (`white`) | `#0F172A` (`slate-900`) | Product cards, dialogs, drawers | Base surface |
| `--color-text-main` | `#0F172A` (`slate-900`) | `#F8FAFC` (`slate-50`) | Headings, product titles, prices | 15.8:1 (AAA) |
| `--color-text-muted` | `#64748B` (`slate-500`) | `#94A3B8` (`slate-400`)| Active ingredients, subtitles, metadata | 4.6:1 (AA) |

---

## 2. Egyptian Consumer User Personas

### 2.1 Persona 1: "عمّ إبراهيم" (Hajj Ibrahim) — The Chronic Disease Patient
- **Demographics**: 64 years old, retired secondary school headmaster, lives in Shubra, Cairo.
- **Medical Situation**: Diagnosed with Type 2 Diabetes and Hypertension for over 12 years. Takes 4 daily medications (Synthetic Metformin equivalent, Synthetic ACE Inhibitor, Cardio-protective aspirin, Vitamin B-Complex).
- **Financial Profile**: Lives on a fixed government pension; highly vulnerable to medicine inflation; constantly worried about sudden price jumps or import shortages.
- **Digital Device & Behavior**: Mid-tier Samsung Galaxy A-series phone; Arabic system interface; uses WhatsApp extensively; struggles with small fonts and low-contrast interfaces; insists on Cash on Delivery (الدفع عند الاستلام كاش) to verify physical medicine boxes before paying.
- **Daily Frustrations**:
  - Wandering between 3 to 4 neighborhood pharmacies searching for out-of-stock chronic meds ("كعب داير في الحر عشان ألاقي علبة الدوا").
  - Packaging redesigns causing anxiety over whether a local generic is genuine.
  - Fear of receiving nearly expired batches.
- **Platform Design Solutions**:
  - Extra-large Cairo typography with high contrast (minimum 16px body, 20px headings).
  - Clear "البديل المحلي المعتمد بنفس المادة الفعالة" with explicit price comparison in EGP.
  - Prominent "صلاحية مضمونة لا تقل عن 12 شهراً" badge on product cards.
  - Cash on Delivery pre-selected by default with zero digital payment friction.

---

### 2.2 Persona 2: "مريم" (Mariam) — The Working Mother & Family Caregiver
- **Demographics**: 32 years old, digital marketing manager and mother of two (a 3-year-old toddler and a 7-year-old girl), lives in Smouha, Alexandria.
- **Medical Situation**: Manages pediatric fevers, seasonal allergies, teething gels, multivitamins, and baby skin creams.
- **Financial Profile**: Dual-income household; prioritizes speed, authentic certified products, and safety over price; willing to pay premium delivery fees for urgent deliveries.
- **Digital Device & Behavior**: iPhone user; prefers modern, clean mobile design with dark mode; pays via InstaPay, Vodafone Cash, or credit card; reads active ingredient tags carefully.
- **Daily Frustrations**:
  - 2:00 AM nocturnal pediatric fever emergencies when physical pharmacies have 90-minute delivery delays.
  - Confusing pediatric liquid dosages (fear of paracetamol toxicity or milliliter dosage errors).
  - Juggling multiple vitamins while worrying about duplicate active ingredients across different brand names.
- **Platform Design Solutions**:
  - Emergency fast-order pediatric section (`أدوية الأطفال وخافض الحرارة`).
  - Active ingredient highlighted in bold colored chips to immediately reveal matching generic molecules.
  - Age- and weight-based dosage guidance tables in product accordions.
  - Seamless digital payments (InstaPay QR, Mobile Wallets, Card).

---

### 2.3 Persona 3: "كريم" (Karim) — The Tech-Savvy Professional & Elder Guardian
- **Demographics**: 28 years old, Senior Software Engineer living in New Cairo (التجمع الخامس); elderly parents live independently in Heliopolis (مصر الجديدة).
- **Medical Situation**: Takes athletic protein and daily multivitamins; primarily responsible for ordering, paying for, and tracking his parents' monthly chronic prescriptions.
- **Financial Profile**: High disposable income; expects flawless modern UX, fast search auto-suggest, instant digital receipts, and scheduled delivery windows.
- **Digital Device & Behavior**: Flagship smartphone; dark mode always enabled; searches using Egyptian dialect, brand trade names, or English chemical names; pays strictly via digital cards.
- **Daily Frustrations**:
  - Forgetting the exact monthly refill dates for his parents' medications across town.
  - Deciphering doctor prescriptions sent by his mother via WhatsApp photos.
  - Difficulty entering different delivery addresses with specific courier instructions ("سلم الحاجة للوالدة وخلي بالك الأسانسير عطلان في الدور الرابع").
- **Platform Design Solutions**:
  - Multi-address vault allowing distinct recipient names, Egyptian phone numbers, and delivery instructions.
  - Colloquial Egyptian search engine mapping dialect queries ("دوا صداع", "فوار حموضة", "مسكن") directly to relevant products.
  - Prescription upload preview with status tracking.
  - Interactive dosage schedule preview that can be downloaded or printed for his parents' refrigerator.

---

## 3. Comprehensive 8-Phase Implementation Roadmap

```
+---------------------------------------------------------------------------------------------------------+
|                                    8-PHASE IMPLEMENTATION ROADMAP                                       |
+---------------------------------------------------------------------------------------------------------+
| Phase 1: Brand Naming, Design System & Core Commerce (Current MVP Phase)                                |
| Phase 2: Egyptian Identity, Authentication & Multi-Address Delivery Network                             |
| Phase 3: Digital Prescription Verification Engine & Pharmacist Portal                                   |
| Phase 4: Chronic Disease Program, Monthly Auto-Refill & Family Medicine Vault                           |
| Phase 5: Egyptian Payment Rails (COD, Fawry, InstaPay, Wallets) & Cold-Chain Logistics                  |
| Phase 6: Clinical Decision Support & Advanced Drug-Drug Interaction (DDI) Matrix                        |
| Phase 7: Distributed Pharmacy Branch Network, Real-Time Inventory & FEFO Warehouse Sync                 |
| Phase 8: Tele-Pharmacy Live Video/Chat, AI Triage & National Health Insurance Integration               |
+---------------------------------------------------------------------------------------------------------+
```

### Phase 1: Brand Naming, Design System & Core Commerce (Current Milestone)
- **Scope**: Finalize brand proposal (`Dawaak` / `El-Agzakhana` / `Salamtak`), author complete `SPEC.md`, `PROJECT.md`, and `TEAM_LOG.md`. Establish responsive mobile-first Tailwind RTL Design System with dark mode, calming emerald health palette, and Cairo typography.
- **Functional Views**:
  - Mobile-first Homepage (Hero trust messaging, 8 health categories, promotional flash deals, featured products).
  - Product Details Page (Commercial names in AR/EN, synthetic active ingredient tag, dosage accordions, contraindications, price in EGP, sticky purchase bar, Add to Cart).
  - Interactive Cart Page (Item list, quantity controls, EGP subtotal, delivery calculation, free shipping progress bar, Cash on Delivery indicator).
  - 3 Phase 1 Creative Features: Smart Substitute Finder, Interactive Dosage Schedule, Dialect Search with Voice Mock.
- **Exit Criteria**: Full local build passes (`npm run build`), test suite passes, zero hardcoded secrets, synthetic safety disclaimer visible, client approval ("تمام كمّل").

### Phase 2: Egyptian Identity, Authentication & Multi-Address Network
- **Scope**: User authentication via NextAuth / Supabase Auth supporting Egyptian mobile phone OTP (SMS / WhatsApp verification).
- **Deliverables**: Multi-profile management (Self, Parents, Children), Egyptian Geographic Address Selector (Governorate -> District -> Street / Floor / Apartment) across all 27 Egyptian governorates, and guest checkout mode.

### Phase 3: Digital Prescription Verification Engine & Pharmacist Portal
- **Scope**: High-resolution prescription photo and PDF upload with private AES-256 cloud storage.
- **Deliverables**: Licensed pharmacist review web dashboard, Syndicate registration validation, prescription status workflow (`Pending` -> `Approved` -> `Modified` -> `Rejected`), and automated WhatsApp order confirmation.

### Phase 4: Chronic Disease Program, Monthly Auto-Refill & Family Medicine Vault
- **Scope**: Subscription and adherence management for chronic patients (Hypertension, Diabetes, Cardiac care).
- **Deliverables**: Family Medicine Vault ("محفظة أدوية العائلة"), automated monthly prescription dispatch 5 days before exhaustion, and WhatsApp dosage push reminders.

### Phase 5: Egyptian Payment Rails & Cold-Chain Logistics Integration
- **Scope**: Production checkout integration with Egyptian payment gateways and refrigerated logistics.
- **Deliverables**:
  - Gateways: Cash on Delivery (COD), InstaPay QR code settlement, Fawry reference codes, Mobile Wallets (Vodafone Cash, Orange, Etisalat, WE Pay), and Meeza national cards.
  - Logistics: Cold-chain refrigerated dispatch (2°C - 8°C) for insulin and biologicals with temperature log verification upon delivery.

### Phase 6: Clinical Decision Support & Advanced DDI Matrix
- **Scope**: Real-time pharmacological interaction engine.
- **Deliverables**: Pairwise and multi-drug interaction evaluation, chronic disease contraindication blocks (e.g. blocking decongestants for hypertensive profiles), and pediatric mg/kg dosage calculators.

### Phase 7: Distributed Pharmacy Branch Network & Real-Time Inventory Sync
- **Scope**: B2B ERP integration connecting brick-and-mortar pharmacy branches across Egyptian governorates.
- **Deliverables**: FEFO automated allocation, geo-distributed order routing to nearest branch stocking all items, split-order routing, and automated batch recall quarantine.

### Phase 8: Tele-Pharmacy Live Consultation & National Health Insurance
- **Scope**: Full-fledged telehealth ecosystem and public healthcare integration.
- **Deliverables**: 24/7 live video/audio clinical pharmacist consultation, AI-assisted symptom triage with strict medical referral boundaries, and direct integration with Egypt's Universal Health Insurance (التأمين الصحي الشامل).

---

## 4. Target Database Schema (PostgreSQL / Supabase DDL)

The complete relational schema comprises 9 tables designed for enterprise reliability, auditability, and data minimization under Egyptian Law 151/2020.

```sql
-- ============================================================================
-- EGYPTIAN ONLINE PHARMACY — TARGET DATABASE SCHEMA (PostgreSQL / Supabase)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role_enum AS ENUM ('customer', 'pharmacist', 'admin', 'courier');
CREATE TYPE prescription_status_enum AS ENUM ('pending_review', 'verified', 'rejected', 'partially_dispensed', 'fulfilled');
CREATE TYPE order_status_enum AS ENUM ('pending_review', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('cash_on_delivery', 'fawry', 'instapay', 'credit_card', 'vodafone_cash');
CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'paid', 'refunded', 'failed');

-- 1. PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name_ar VARCHAR(150),
    full_name_en VARCHAR(150),
    phone_number VARCHAR(20) UNIQUE NOT NULL, -- Format: +2010xxxxxxxx
    national_id VARCHAR(14) UNIQUE,           -- Egyptian National ID (14 digits)
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    chronic_conditions TEXT[] DEFAULT '{}',
    known_allergies TEXT[] DEFAULT '{}',
    preferred_language VARCHAR(5) DEFAULT 'ar' CHECK (preferred_language IN ('ar', 'en')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADDRESSES (Egyptian Governorate & City Mapping)
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL DEFAULT 'المنزل',
    governorate_id VARCHAR(50) NOT NULL,        -- 'cairo', 'giza', 'alexandria', etc.
    governorate_name_ar VARCHAR(100) NOT NULL,
    governorate_name_en VARCHAR(100) NOT NULL,
    city_ar VARCHAR(100) NOT NULL,             -- e.g., مدينة نصر، المعادي، الدقي
    city_en VARCHAR(100) NOT NULL,
    street_address TEXT NOT NULL,
    building_number VARCHAR(30),
    floor VARCHAR(20),
    apartment VARCHAR(20),
    special_landmark TEXT,                      -- e.g., بجوار مستشفى كليوباترا
    postal_code VARCHAR(10),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,                 -- e.g., 'analgesics-pain'
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon_name VARCHAR(50) NOT NULL,
    parent_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS (Strict Synthetic Compliance & Dual Language)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    active_ingredient VARCHAR(200) NOT NULL,    -- Strictly synthetic (e.g. Syntraphol)
    concentration VARCHAR(100) NOT NULL,        -- e.g., '500 mg', '10 mg/5ml'
    dosage_form VARCHAR(50) NOT NULL,           -- e.g., 'Tablets', 'Syrup', 'Effervescent'
    dosage_form_ar VARCHAR(50) NOT NULL,        -- e.g., 'أقراص', 'شراب', 'فوار'
    pack_size VARCHAR(100) NOT NULL,            -- e.g., '20 Tablets (2 Strips)'
    pack_size_ar VARCHAR(100) NOT NULL,         -- e.g., '20 قرص (شريطين)'
    manufacturer VARCHAR(150) NOT NULL,         -- e.g., 'PharmaNile Egypt Labs'
    manufacturer_ar VARCHAR(150) NOT NULL,      -- e.g., 'معامل فارما نايل مصر'
    price_egp NUMERIC(10, 2) NOT NULL CHECK (price_egp >= 0),
    sale_price_egp NUMERIC(10, 2) CHECK (sale_price_egp IS NULL OR sale_price_egp < price_egp),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_order_quantity INT NOT NULL DEFAULT 1,
    max_order_quantity INT NOT NULL DEFAULT 5,  -- Anti-hoarding cap
    prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
    storage_conditions VARCHAR(200) NOT NULL,
    storage_conditions_ar VARCHAR(200) NOT NULL,
    barcode VARCHAR(50),
    images JSONB NOT NULL DEFAULT '[]',
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    dosage_instructions_ar TEXT NOT NULL,
    dosage_instructions_en TEXT NOT NULL,
    warnings_ar TEXT NOT NULL,
    warnings_en TEXT NOT NULL,
    contraindications_ar TEXT,
    contraindications_en TEXT,
    is_synthetic BOOLEAN NOT NULL DEFAULT TRUE, -- Compliance safety flag
    synthetic_disclaimer_ar TEXT NOT NULL DEFAULT 'بيانات دوائية تجريبية لأغراض المحاكاة والتطوير فقط - المادة الفعالة غير حقيقية',
    synthetic_disclaimer_en TEXT NOT NULL DEFAULT 'Synthetic mock pharmaceutical data for development purposes only - Active ingredient is simulated',
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating BETWEEN 1.0 AND 5.0),
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRESCRIPTIONS (Patient Health Document Vault)
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    file_path TEXT NOT NULL,                   -- Private cloud storage key
    file_mime_type VARCHAR(50) NOT NULL,       -- image/jpeg, image/png, application/pdf
    file_size_bytes INT NOT NULL CHECK (file_size_bytes <= 5242880), -- 5MB limit
    patient_name VARCHAR(150),
    patient_age INT,
    doctor_name VARCHAR(150),
    doctor_syndicate_id VARCHAR(50),           -- Egyptian Medical Syndicate ID
    clinic_hospital_name VARCHAR(150),
    diagnosis_notes TEXT,
    status prescription_status_enum NOT NULL DEFAULT 'pending_review',
    pharmacist_notes TEXT,
    verified_by_pharmacist_id UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CARTS (Persistent Carts for Registered & Guest Sessions)
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CART ITEMS
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity >= 1 AND quantity <= 5),
    unit_price_egp NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 8. ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(35) UNIQUE NOT NULL,   -- e.g., 'EG-PH-2026-10492'
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    status order_status_enum NOT NULL DEFAULT 'pending_review',
    payment_method payment_method_enum NOT NULL DEFAULT 'cash_on_delivery',
    payment_status payment_status_enum NOT NULL DEFAULT 'unpaid',
    subtotal_egp NUMERIC(10, 2) NOT NULL CHECK (subtotal_egp >= 0),
    delivery_fee_egp NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
    discount_egp NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_egp NUMERIC(10, 2) NOT NULL CHECK (total_egp >= 0),
    delivery_address JSONB NOT NULL,
    customer_notes TEXT,
    estimated_delivery_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ORDER ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name_ar VARCHAR(200) NOT NULL,
    product_name_en VARCHAR(200) NOT NULL,
    active_ingredient VARCHAR(200) NOT NULL,
    unit_price_egp NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1),
    total_price_egp NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_prescription ON products(prescription_required);
CREATE INDEX idx_products_price ON products(price_egp);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_prescriptions_user ON prescriptions(user_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own prescriptions" ON prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upload own prescriptions" ON prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read active products" ON products FOR SELECT USING (TRUE);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (is_active = TRUE);
```

---

## 5. Tech Stack Specifications

- **Next.js 14/15 App Router**: Server and client component separation, optimized image delivery, and modular routing.
- **TypeScript (Strict Mode)**: Comprehensive domain interfaces for all entities (`SyntheticProduct`, `CartItem`, `Category`, `Order`).
- **Tailwind CSS RTL Engine**: Configured with logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) guaranteeing zero broken margins or misaligned paddings when toggling between Arabic and English.
- **Cairo & Geist Fonts**:
  - `Cairo` for Arabic with customized `leading-relaxed` (1.625) and `leading-loose` (1.75) to prevent glyph truncation.
  - `Geist` / `Inter` for Latin medical and scientific terms.
- **Zustand State Stores**:
  - `useCartStore`: Cart state with item quantity capping (max 5), EGP subtotal calculation, delivery fee rules (free above 300 EGP), and SSR hydration guard.
  - `useLocaleStore`: Locale and direction synchronizer (`ar` / `rtl` vs. `en` / `ltr`) dynamically modifying `document.documentElement.dir`.
- **In-Memory Mock Service**: Decoupled TypeScript service (`src/lib/services/product-service.ts`) providing zero-latency search, category filtering, and slug queries without external database dependencies for Phase 1.

---

## 6. Pharmacy Domain Logic & Regulatory Compliance

### 6.1 Regulatory Drug Classification (Egyptian Drug Authority - EDA)
1. **OTC (Over-The-Counter / بدون وصفة طبية)**:
   - Scope: Analgesics, antipyretics, cough syrups, antacids, vitamins, topical creams, first aid.
   - Behavior: Direct purchase permitted; anti-hoarding cap enforced (max 5 units per order).
2. **Prescription-Only (Rx / أدوية بروشتة طبية معتمدة)**:
   - Scope: Synthetic cardiovascular, antidiabetic, antibiotic, and antihypertensive agents.
   - Behavior: Added to cart with amber warning badge (`يتطلب روشتة طبية سارية`); checkout flags the order as requiring pharmacist verification before dispatch.
3. **Controlled Substances (أدوية الجدول والرقابة الخاصة)**:
   - Scope: Controlled psychotropic agents (Schedule 1 & 2 under Egyptian Law 182/1960).
   - Behavior: **Strictly prohibited** from home delivery and online payment. Informational notice only directing patients to physical branch dispensing with original physical prescription and National ID.

### 6.2 Generic Equivalence & Active Ingredient Mapping (البدائل والمثائل)
In Egypt, import fluctuations necessitate distinguishing between trade brands and active pharmaceutical ingredients:
- **Identical Generic Equivalent (بديل متطابق)**:
  - 100% identical synthetic chemical molecule, concentration, and dosage form.
  - Platform automatically surfaces certified domestic equivalents with price savings in EGP.
- **Therapeutic Alternative (مثيل علاجي)**:
  - Similar therapeutic class but different chemical compound.
  - Requires explicit pharmacist consultation warning; never swapped automatically.

### 6.3 Drug-Drug Interaction (DDI) Logic
- **Level 1 (Mild / Precautionary)**: Informational hint (e.g. space 2 hours apart from dairy products).
- **Level 2 (Moderate / Monitor)**: Amber alert indicating potential additive side effects.
- **Level 3 (Severe / Contraindicated)**: Prominent red medical warning in Cart and Checkout requiring clinical pharmacist consultation before dispatch.

### 6.4 Expiry Tracking & FEFO Warehouse Rule
- All inventory tracked via First-Expired, First-Out (FEFO).
- Medications with less than 6 months shelf life are blocked from chronic monthly auto-refill orders.
- Batch transparency badge displayed on PDP: *"صلاحية مضمونة: صلاحية التشغيلة لا تقل عن 12 شهراً"*.

### 6.5 Synthetic Medical Data Mandate
- In strict adherence to safety directives, all medicines use fabricated compounds prefixed with synthetic markers (e.g. `Syntraphol`, `PharmaCure-DX`, `EgyptoCalm`, `CardioCare-X`).
- Every product entity enforces `is_synthetic: true`.
- Permanent simulation disclaimer rendered on all views:
  > *"تنبيه: هذا التطبيق نموذج تجريبي تقني يستخدم بيانات طبية افتراضية واختبارية لأغراض المحاكاة البرمجية فقط ولا يمثل نصائح طبية حقيقية. استشر طبيبك أو صيدليك دائماً."*

---

## 7. Creative Innovations for Phase 1

### Feature 1: "كاشف البديل الذكي ووفّر مع المصري" (Smart Egyptian Substitute Finder & Price Optimizer)
- **Problem Solved**: High medicine prices and frequent shortages of imported brand-name drugs in Egyptian pharmacies.
- **UX & Mechanism**:
  - Interactive pill button on PDP and Cart: *"متوفر بديل مصري مطابق 100% — وفر 35 ج.م"*.
  - Opens a side-by-side comparison modal displaying:
    - Active Ingredient Match: 100% identical concentration and molecule.
    - EGP Price Comparison: Branded (85.00 ج.م) vs. Egyptian Generic (50.00 ج.م) -> Save 35.00 ج.م.
    - Single-click action *"استبدل ووفر الآن"* that atomically swaps the item in the cart.

### Feature 2: "جدول مواعيد الدواء الذكي" (Interactive Visual Dosage Schedule & Pill Organizer Preview)
- **Problem Solved**: Confusion among patients (especially elderly and chronic patients) over when and how to take multiple medications safely.
- **UX & Mechanism**:
  - Automatically parses medications in the active cart and renders a visual daily pill schedule card at the bottom of the Cart page.
  - Organizes medications into daily time buckets:
    - 🌅 **الصباح (مع الإفطار)**: e.g., CardioCare-X (1 قرص بعد الإفطار).
    - ☀️ **الظهر (بعد الغداء)**: e.g., VitaBoost-Max (1 كبسولة).
    - 🌙 **المساء (قبل النوم)**: e.g., SleepEasy-Synth (1 كبسولة).
  - Features an action to preview or download a printable schedule card ("اطبع الجدول وعلقه على الثلاجة") and a 30-day refill timeline counter.

### Feature 3: "دور باللي بتقوله" (Egyptian Dialect-Friendly Search with Voice Mock)
- **Problem Solved**: Egyptian consumers search by colloquial symptom descriptions rather than Latin scientific drug names.
- **UX & Mechanism**:
  - Smart search input placeholder: *"ابحث باسم الدوا، المادة الفعالة، أو اللي حاسس بيه (مثلاً: صداع، سخونية، فوار حموضة)..."*
  - Below search bar, quick-tap Egyptian symptom chips: `💊 صداع` | `🔥 سخونية` | `🤢 مغص وحموضة` | `👶 أدوية أطفال` | `⚡ إرهاق وفيتامينات`.
  - **Voice Search Mock**: Clicking the microphone button triggers an animated Egyptian audio waveform with the status: *"سامعينك.. اتكلم باللهجة المصرية"* and auto-populates popular Egyptian colloquial queries.

---

## 8. Non-Functional, Security & Privacy Requirements

1. **Egyptian Personal Data Protection Law (151/2020)**:
   - Patient health profiles and prescriptions are classified as Sensitive Personal Data.
   - Explicit Arabic opt-in consent collected prior to order submission.
   - Data minimization strictly enforced: no unnecessary telemetry or persistent tracking.
2. **Zero Hardcoded Secrets**:
   - Zero credentials or tokens in source code.
   - Comprehensive `.env.example` provided for local setup.
   - Pre-commit secret scanning checks.
3. **Performance & Mobile Responsiveness**:
   - Mobile-first layout optimized for viewports 360px to 430px.
   - First Contentful Paint (FCP) < 1.2s; zero Cumulative Layout Shift (CLS) during RTL toggles.
   - All interactive touch targets exceed 44x44px.
