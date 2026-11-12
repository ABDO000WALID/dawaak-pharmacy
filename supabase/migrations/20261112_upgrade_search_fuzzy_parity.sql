-- Migration: 20261112_upgrade_search_fuzzy_parity.sql
-- Description: Upgrades search_products_fuzzy with normalize_arabic helper, word_similarity, and dialect mapping support
-- Target: Parity with MockCatalogRepository across the authoritative 20-case search matrix.

-- 1. Create normalize_arabic function for immutable normalization inside PostgreSQL
CREATE OR REPLACE FUNCTION normalize_arabic(text_input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            coalesce(text_input, ''),
            '[\u064B-\u065F\u0670\u0640]', '', 'g'
          ),
          '[أإآٱ]', 'ا', 'g'
        ),
        'ة', 'ه', 'g'
      ),
      '[ىي]', 'ي', 'g'
    )
  );
$$;

-- 2. Upgrade search_products_fuzzy to use word_similarity, normalize_arabic, and dialect_slugs
CREATE OR REPLACE FUNCTION search_products_fuzzy(
    search_term TEXT,
    similarity_threshold FLOAT DEFAULT 0.20,
    filter_category TEXT DEFAULT NULL,
    filter_prescription BOOLEAN DEFAULT NULL,
    min_price NUMERIC DEFAULT NULL,
    max_price NUMERIC DEFAULT NULL,
    limit_count INT DEFAULT 12,
    offset_count INT DEFAULT 0,
    dialect_slugs TEXT[] DEFAULT NULL
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
    WITH query_prep AS (
        SELECT 
            normalize_arabic(search_term) as norm_search,
            lower(trim(search_term)) as raw_search
    )
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
            CASE WHEN dialect_slugs IS NOT NULL AND p.slug = ANY(dialect_slugs) THEN 0.85 ELSE 0.0 END,
            word_similarity(qp.norm_search, normalize_arabic(p.name_ar)),
            word_similarity(qp.norm_search, normalize_arabic(p.active_ingredient_ar)),
            similarity(normalize_arabic(p.name_ar), qp.norm_search),
            similarity(normalize_arabic(p.active_ingredient_ar), qp.norm_search),
            word_similarity(qp.raw_search, lower(p.name_en)),
            word_similarity(qp.raw_search, lower(p.active_ingredient_en)),
            similarity(lower(p.name_en), qp.raw_search),
            similarity(lower(p.active_ingredient_en), qp.raw_search)
        )::FLOAT AS similarity_score
    FROM products p, query_prep qp
    WHERE 
        (filter_category IS NULL OR p.category_id = filter_category)
        AND (filter_prescription IS NULL OR p.prescription_required = filter_prescription)
        AND (min_price IS NULL OR COALESCE(p.sale_price_egp, p.price_egp) >= min_price)
        AND (max_price IS NULL OR COALESCE(p.sale_price_egp, p.price_egp) <= max_price)
        AND (
            (dialect_slugs IS NOT NULL AND p.slug = ANY(dialect_slugs))
            OR normalize_arabic(p.name_ar) ILIKE ('%' || qp.norm_search || '%')
            OR normalize_arabic(p.active_ingredient_ar) ILIKE ('%' || qp.norm_search || '%')
            OR lower(p.name_en) ILIKE ('%' || qp.raw_search || '%')
            OR lower(p.active_ingredient_en) ILIKE ('%' || qp.raw_search || '%')
            OR word_similarity(qp.norm_search, normalize_arabic(p.name_ar)) >= similarity_threshold
            OR word_similarity(qp.norm_search, normalize_arabic(p.active_ingredient_ar)) >= similarity_threshold
            OR similarity(normalize_arabic(p.name_ar), qp.norm_search) >= similarity_threshold
            OR word_similarity(qp.raw_search, lower(p.name_en)) >= similarity_threshold
            OR word_similarity(qp.raw_search, lower(p.active_ingredient_en)) >= similarity_threshold
            OR similarity(lower(p.name_en), qp.raw_search) >= similarity_threshold
        )
    ORDER BY similarity_score DESC, p.rating DESC
    LIMIT limit_count
    OFFSET offset_count;
$$;
