-- ============================================================================
-- EGYPTIAN ONLINE PHARMACY (DAWAAK) — CATALOG SCHEMA MIGRATION (Phase 2)
-- Database Engine: PostgreSQL 14+ / Supabase
-- Target Tables: categories, products
-- Extensions: uuid-ossp, pg_trgm (Trigram Fuzzy Search)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,                  -- e.g., 'analgesics-pain'
    name_ar VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon_name VARCHAR(50) NOT NULL,
    parent_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Products Table (Strict Synthetic Pharmaceutical Compliance)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'prod-syn-001'
    sku VARCHAR(64) UNIQUE NOT NULL,             -- e.g. 'EGY-SYN-001'
    slug VARCHAR(250) UNIQUE NOT NULL,           -- e.g. 'syntraphol-extra-500'
    name_ar VARCHAR(250) NOT NULL,
    name_en VARCHAR(250) NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    active_ingredient_ar VARCHAR(250) NOT NULL,  -- Fictional active molecule in Arabic
    active_ingredient_en VARCHAR(250) NOT NULL,  -- Fictional active molecule in English
    concentration VARCHAR(100) NOT NULL,         -- e.g. '500 mg'
    dosage_form VARCHAR(50) NOT NULL,            -- 'Tablets', 'Syrup', 'Capsules', etc.
    dosage_form_ar VARCHAR(50) NOT NULL,         -- 'أقراص', 'شراب', 'كبسولات', etc.
    pack_size VARCHAR(100) NOT NULL,             -- '20 Tablets (2 Strips)'
    pack_size_ar VARCHAR(100) NOT NULL,          -- '20 قرص (شريطين)'
    manufacturer VARCHAR(150) NOT NULL,          -- 'PharmaNile Egypt Labs'
    manufacturer_ar VARCHAR(150) NOT NULL,       -- 'معامل فارما نايل مصر'
    price_egp NUMERIC(10, 2) NOT NULL CHECK (price_egp >= 0),
    sale_price_egp NUMERIC(10, 2) CHECK (sale_price_egp IS NULL OR sale_price_egp < price_egp),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_order_quantity INT NOT NULL DEFAULT 1,
    max_order_quantity INT NOT NULL DEFAULT 5 CHECK (max_order_quantity <= 5),   -- Anti-hoarding safety limit
    prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
    storage_conditions VARCHAR(250) NOT NULL,
    storage_conditions_ar VARCHAR(250) NOT NULL,
    images JSONB NOT NULL DEFAULT '[]',
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    dosage_instructions_ar TEXT NOT NULL,
    dosage_instructions_en TEXT NOT NULL,
    warnings_ar JSONB NOT NULL DEFAULT '[]',
    warnings_en JSONB NOT NULL DEFAULT '[]',
    is_synthetic BOOLEAN NOT NULL DEFAULT TRUE CHECK (is_synthetic = TRUE),  -- Mandatory safety flag
    synthetic_disclaimer_ar TEXT NOT NULL DEFAULT 'بيانات دوائية تجريبية لأغراض المحاكاة والتطوير فقط - المادة الفعالة غير حقيقية',
    synthetic_disclaimer_en TEXT NOT NULL DEFAULT 'Synthetic mock pharmaceutical data for development purposes only - Active ingredient is simulated',
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating BETWEEN 1.0 AND 5.0),
    reviews_count INT DEFAULT 0,
    substitute_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
    substitute_savings_egp NUMERIC(10, 2) DEFAULT 0.00,
    timing_bucket VARCHAR(20) CHECK (timing_bucket IN ('morning', 'noon', 'night')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. Trigram GIN Indexes (Fast Typo-Tolerant Similarity & Substring search)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_name_ar_trgm ON products USING gin (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_en_trgm ON products USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_active_ar_trgm ON products USING gin (active_ingredient_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_active_en_trgm ON products USING gin (active_ingredient_en gin_trgm_ops);

-- Standard relational indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_egp);
CREATE INDEX IF NOT EXISTS idx_products_prescription ON products(prescription_required);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Categories: Public read access for active categories
CREATE POLICY "Public read active categories" 
ON categories FOR SELECT 
USING (is_active = TRUE);

-- Products: Public read access for all catalog items
CREATE POLICY "Public read products" 
ON products FOR SELECT 
USING (TRUE);

-- Secure Mutations: Only service_role or admin may insert/update/delete
CREATE POLICY "Service role full access categories" 
ON categories FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access products" 
ON products FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 6. Stored Function for Server-Side Trigram Fuzzy Search (RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION search_products_fuzzy(
    search_term TEXT,
    similarity_threshold FLOAT DEFAULT 0.25,
    filter_category TEXT DEFAULT NULL,
    filter_prescription BOOLEAN DEFAULT NULL,
    min_price NUMERIC DEFAULT NULL,
    max_price NUMERIC DEFAULT NULL,
    limit_count INT DEFAULT 12,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    id VARCHAR(64),
    sku VARCHAR(64),
    slug VARCHAR(250),
    name_ar VARCHAR(250),
    name_en VARCHAR(250),
    category_id VARCHAR(50),
    active_ingredient_ar VARCHAR(250),
    active_ingredient_en VARCHAR(250),
    concentration VARCHAR(100),
    dosage_form VARCHAR(50),
    dosage_form_ar VARCHAR(50),
    pack_size VARCHAR(100),
    pack_size_ar VARCHAR(100),
    manufacturer VARCHAR(150),
    manufacturer_ar VARCHAR(150),
    price_egp NUMERIC(10, 2),
    sale_price_egp NUMERIC(10, 2),
    stock_quantity INT,
    min_order_quantity INT,
    max_order_quantity INT,
    prescription_required BOOLEAN,
    storage_conditions VARCHAR(250),
    storage_conditions_ar VARCHAR(250),
    images JSONB,
    description_ar TEXT,
    description_en TEXT,
    dosage_instructions_ar TEXT,
    dosage_instructions_en TEXT,
    warnings_ar JSONB,
    warnings_en JSONB,
    is_synthetic BOOLEAN,
    synthetic_disclaimer_ar TEXT,
    synthetic_disclaimer_en TEXT,
    rating NUMERIC(3, 2),
    reviews_count INT,
    substitute_id VARCHAR(64),
    substitute_savings_egp NUMERIC(10, 2),
    timing_bucket VARCHAR(20),
    similarity_score FLOAT
) 
LANGUAGE sql STABLE AS $$
    SELECT 
        p.id, p.sku, p.slug, p.name_ar, p.name_en, p.category_id,
        p.active_ingredient_ar, p.active_ingredient_en, p.concentration,
        p.dosage_form, p.dosage_form_ar, p.pack_size, p.pack_size_ar,
        p.manufacturer, p.manufacturer_ar, p.price_egp, p.sale_price_egp,
        p.stock_quantity, p.min_order_quantity, p.max_order_quantity,
        p.prescription_required, p.storage_conditions, p.storage_conditions_ar,
        p.images, p.description_ar, p.description_en,
        p.dosage_instructions_ar, p.dosage_instructions_en,
        p.warnings_ar, p.warnings_en, p.is_synthetic,
        p.synthetic_disclaimer_ar, p.synthetic_disclaimer_en,
        p.rating, p.reviews_count, p.substitute_id, p.substitute_savings_egp,
        p.timing_bucket,
        GREATEST(
            similarity(p.name_ar, search_term),
            similarity(p.name_en, search_term),
            similarity(p.active_ingredient_ar, search_term),
            similarity(p.active_ingredient_en, search_term)
        )::FLOAT AS similarity_score
    FROM products p
    WHERE 
        (filter_category IS NULL OR p.category_id = filter_category)
        AND (filter_prescription IS NULL OR p.prescription_required = filter_prescription)
        AND (min_price IS NULL OR COALESCE(p.sale_price_egp, p.price_egp) >= min_price)
        AND (max_price IS NULL OR COALESCE(p.sale_price_egp, p.price_egp) <= max_price)
        AND (
            p.name_ar ILIKE ('%' || search_term || '%')
            OR p.name_en ILIKE ('%' || search_term || '%')
            OR p.active_ingredient_ar ILIKE ('%' || search_term || '%')
            OR p.active_ingredient_en ILIKE ('%' || search_term || '%')
            OR similarity(p.name_ar, search_term) >= similarity_threshold
            OR similarity(p.name_en, search_term) >= similarity_threshold
            OR similarity(p.active_ingredient_ar, search_term) >= similarity_threshold
            OR similarity(p.active_ingredient_en, search_term) >= similarity_threshold
        )
    ORDER BY similarity_score DESC, p.rating DESC
    LIMIT limit_count
    OFFSET offset_count;
$$;
