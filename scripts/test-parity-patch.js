import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

// Safe .env.local loader
function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Import Arabic normalizer and DIALECT_MAP from src/
// We can define the identical normalizer and dialect map
function normalizeArabic(text) {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFKC')
    .replace(/(?:[\u0640]*\u0627[\u0640]*\u064B|[\u0640]*\u064B[\u0640]*\u0627)/g, '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .trim()
    .toLowerCase();
}

const DIALECT_MAP = {
  'صداع': ['syntraphol-extra-500', 'syntraphol-nile-generic-500', 'vitamol-plus-fast', 'citra-cold-sinus'],
  'سخونية': ['syntraphol-extra-500', 'pediatric-cough-k-oral', 'syntraphol-nile-generic-500', 'kids-relief-fever-syrup'],
  'حرارة': ['syntraphol-extra-500', 'pediatric-cough-k-oral', 'kids-relief-fever-syrup'],
  'مغص': ['egyptocalm-effervescent', 'gastroshield-m-20', 'ombrasynth-local-20', 'ombrasynth-colon-care', 'pediasynth-colic-drops'],
  'حموضة': ['gastroshield-m-20', 'egyptocalm-effervescent', 'ombrasynth-local-20', 'ombrasynth-colon-care'],
  'فوار': ['egyptocalm-effervescent', 'pulmo-relief-sachets'],
  'كحة': ['pharmacure-dx-syrup', 'pediatric-cough-k-oral', 'bronchosynth-expectorant-syrup', 'pulmo-relief-sachets'],
  'سعال': ['pharmacure-dx-syrup', 'pediatric-cough-k-oral', 'bronchosynth-expectorant-syrup'],
  'بلغم': ['pharmacure-dx-syrup', 'bronchosynth-expectorant-syrup', 'pulmo-relief-sachets'],
  'أعصاب': ['neurorelief-z-50'],
  'فيتامين': ['vitaboost-max-daily', 'calci-synth-d3', 'zincosynth-c', 'ferro-synth-iron'],
  'فيتامينات': ['vitaboost-max-daily', 'sleepeasy-synth-night', 'calci-synth-d3', 'zincosynth-c'],
  'ضغط': ['cardiocare-x-10', 'cardiosynth-egypt-10', 'hypersynth-plus-combo'],
  'سكر': ['glucofix-syn-500', 'glucofix-nile-domestic-500'],
  'مفاصل': ['osteojoint-synth-extra', 'relaxogen-forte-relaxant'],
  'عضلات': ['relaxogen-forte-relaxant'],
  'ركبة': ['osteojoint-synth-extra'],
  'خشونة': ['osteojoint-synth-extra'],
  'جروح': ['septoderm-antiseptic-spray', 'dermoheal-plus-gel'],
  'حروق': ['dermoheal-plus-gel'],
  'مطهر': ['septoderm-antiseptic-spray'],
  'عين': ['ocuclear-s-eye-drops'],
  'عيني': ['ocuclear-s-eye-drops'],
  'جفاف': ['ocuclear-s-eye-drops', 'dermoheal-plus-gel'],
  'نوم': ['sleepeasy-synth-night'],
  'أرق': ['sleepeasy-synth-night'],
  'أطفال': ['pediatric-cough-k-oral', 'kids-relief-fever-syrup', 'teething-care-gel', 'pediasynth-colic-drops', 'baby-rehydra-sachets'],
  'بشرة': ['dermoheal-plus-gel'],
  'حب شباب': ['dermoheal-plus-gel'],
  'تسنين': ['teething-care-gel'],
  'حرارة أطفال': ['pediatric-cough-k-oral', 'kids-relief-fever-syrup'],
};

async function test() {
  const client = await pool.connect();

  // Create or replace an upgraded search_products_fuzzy that uses word_similarity and matches dialect slugs
  console.log('Upgrading search_products_fuzzy in Postgres...');
  await client.query(`
    -- Create SQL unaccent/normalizer helper
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
  `);

  console.log('Testing all 20 cases with upgraded function...');

  const AUTHORITATIVE_20_CASES = [
    { id: 'TC-EMLA-01', cat: 'إملائي', q: 'سينترافل', target: 'syntraphol-extra-500' },
    { id: 'TC-EMLA-02', cat: 'إملائي', q: 'سبتودرم', target: 'septoderm-antiseptic-spray' },
    { id: 'TC-EMLA-03', cat: 'إملائي', q: 'ايجبتوكالم', target: 'egyptocalm-effervescent' },
    { id: 'TC-EMLA-04', cat: 'إملائي', q: 'جاستروشلد', target: 'gastroshield-m-20' },
    { id: 'TC-TASH-01', تشكيل: 'تشكيل', q: 'سِينْتْرَافُولْ إِكْسْتْرَا', target: 'syntraphol-extra-500' },
    { id: 'TC-TASH-02', تشكيل: 'تشكيل', q: 'فَارْمَاكِيُور-دِي إِكْس شَرَابٌ', target: 'pharmacure-dx-syrup' },
    { id: 'TC-TASH-03', تشكيل: 'تشكيل', q: 'إِيجِيبْتُوكَالْم فَوَّارٌ', target: 'egyptocalm-effervescent' },
    { id: 'TC-TASH-04', تشكيل: 'تشكيل', q: 'سِينْتْرَافُولاً', target: 'syntraphol-extra-500' },
    { id: 'TC-KASH-01', كشيدة: 'كشيدة', q: 'سـيـنـتـرافـول إكـسـتـرا', target: 'syntraphol-extra-500' },
    { id: 'TC-KASH-02', كشيدة: 'كشيدة', q: 'فَـــــوَّار هـــــاضـم', target: 'egyptocalm-effervescent' },
    { id: 'TC-KASH-03', كشيدة: 'كشيدة', q: 'جـاسـتـروشـيـلـد', target: 'gastroshield-m-20' },
    { id: 'TC-KASH-04', كشيدة: 'كشيدة', q: 'كـارديـوكـيـر-إكـس', target: 'cardiocare-x-10' },
    { id: 'TC-DIAL-01', عامية: 'عامية', q: 'سخونية', target: 'syntraphol-extra-500' },
    { id: 'TC-DIAL-02', عامية: 'عامية', q: 'عايز فوار للحموضة', target: 'egyptocalm-effervescent' },
    { id: 'TC-DIAL-03', عامية: 'عامية', q: 'مغص وبطني وجعاني', target: 'egyptocalm-effervescent' },
    { id: 'TC-DIAL-04', عامية: 'عامية', q: 'وجع مفاصل', target: 'osteojoint-synth-extra' },
    { id: 'TC-ENGL-01', إنجليزي: 'إنجليزي', q: 'syntrafol', target: 'syntraphol-extra-500' },
    { id: 'TC-ENGL-02', إنجليزي: 'إنجليزي', q: 'pharmacur', target: 'pharmacure-dx-syrup' },
    { id: 'TC-ENGL-03', إنجليزي: 'إنجليزي', q: 'egiptocalm', target: 'egyptocalm-effervescent' },
    { id: 'TC-ENGL-04', إنجليزي: 'إنجليزي', q: 'gastroshild', target: 'gastroshield-m-20' },
  ];

  let passed = 0;
  for (const tc of AUTHORITATIVE_20_CASES) {
    const normQ = normalizeArabic(tc.q);
    const rawQ = tc.q.trim().toLowerCase();

    // Check DIALECT_MAP
    const dialectSlugs = [];
    for (const [symp, slugs] of Object.entries(DIALECT_MAP)) {
      const normSymp = normalizeArabic(symp);
      if (
        (normQ && (normQ.includes(normSymp) || (normQ.length >= 2 && normSymp.includes(normQ)))) ||
        (rawQ && (rawQ.includes(symp.toLowerCase()) || (rawQ.length >= 2 && symp.toLowerCase().includes(rawQ))))
      ) {
        dialectSlugs.push(...slugs);
      }
    }

    const res = await client.query(`
      SELECT slug, name_ar, similarity_score 
      FROM search_products_fuzzy($1, 0.20, NULL, NULL, NULL, NULL, 12, 0, $2)
    `, [tc.q, dialectSlugs.length > 0 ? dialectSlugs : null]);

    const hasTarget = res.rows.some(r => r.slug === tc.target || r.slug.startsWith(tc.target));
    if (hasTarget) passed++;
    console.log(`[${tc.id}] "${tc.q}" -> ${hasTarget ? '✔ PASS' : '✖ FAIL'} (top: ${res.rows[0]?.slug}, score: ${res.rows[0]?.similarity_score})`);
  }

  console.log(`\nNew Pass Rate: ${passed} / 20 (${((passed/20)*100).toFixed(1)}%)`);

  client.release();
  await pool.end();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
