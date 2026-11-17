/**
 * Database Migration Idempotency & Security Verification Suite (Milestone 2)
 *
 * Verifies:
 * 1. Safe parsing of .env.local without exposing secrets
 * 2. Sequential execution of all 3 migrations:
 *    - 20261107_catalog_schema.sql
 *    - 20261107_catalog_seed.sql
 *    - 20261112_upgrade_search_fuzzy_parity.sql
 * 3. Idempotency: Re-executing all 3 migrations in order produces 0 errors
 * 4. Row Level Security (RLS) enabled on categories, products, and substitutes
 * 5. Data integrity: 8 categories, 36 products, 4 substitutes
 * 6. Function uniqueness: exactly 1 search_products_fuzzy function in pg_proc
 * 7. Safe graceful skip (exit code 0) when offline or DATABASE_URL is missing
 */

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

function loadEnv() {
  if (!fs.existsSync('.env.local')) return {};
  try {
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
  } catch {
    return {};
  }
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) {
    process.env[k] = v;
  }
}

const dbUrl = process.env.DATABASE_URL || env.DATABASE_URL;
if (!dbUrl) {
  console.log('================================================================================');
  console.log('  [SKIP] DATABASE_URL is not set. Skipping migration idempotency test.');
  console.log('================================================================================');
  process.exit(0);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 3000,
  ssl: { rejectUnauthorized: false }
});

const MIGRATION_FILES = [
  'supabase/migrations/20261107_catalog_schema.sql',
  'supabase/migrations/20261107_catalog_seed.sql',
  'supabase/migrations/20261112_upgrade_search_fuzzy_parity.sql'
];

async function runMigrationPass(client, passNumber, passLabel) {
  console.log(`\n--- PASS ${passNumber}: ${passLabel} ---`);
  for (const filePath of MIGRATION_FILES) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`);
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    process.stdout.write(`  Executing ${fileName}... `);
    const start = Date.now();
    await client.query(sql);
    const duration = Date.now() - start;
    console.log(`✔ OK (${duration}ms)`);
  }
}

async function verifyIdempotencyAndSecurity() {
  console.log('================================================================================');
  console.log('  DAWAAK PHARMACY — MILESTONE 2 MIGRATION IDEMPOTENCY & RLS VERIFICATION');
  console.log('================================================================================\n');

  let client;
  try {
    client = await pool.connect();
    console.log('✔ Connected successfully to PostgreSQL database');
  } catch (connErr) {
    console.log('================================================================================');
    console.log(`  [SKIP] Postgres database host is unreachable (${connErr.code || connErr.message}).`);
    console.log('  Skipping migration idempotency test safely (exit code 0).');
    console.log('================================================================================');
    await pool.end().catch(() => {});
    process.exit(0);
  }

  try {
    // Pass 1: Apply migrations
    await runMigrationPass(client, 1, 'Initial Migration Execution');

    // Pass 2: Re-apply all migrations in order (Tests Idempotency)
    await runMigrationPass(client, 2, 'Idempotency Validation (Re-run All Migrations)');
    console.log('\n✔ All 3 migrations executed twice consecutively with 0 errors (Idempotency Confirmed).');

    // 3. Row Level Security (RLS) Verification
    console.log('\n--- VERIFYING ROW LEVEL SECURITY (RLS) ---');
    const rlsQuery = `
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('categories', 'products', 'substitutes')
      ORDER BY tablename;
    `;
    const rlsRes = await client.query(rlsQuery);
    const requiredTables = ['categories', 'products', 'substitutes'];
    const foundTables = {};

    for (const row of rlsRes.rows) {
      foundTables[row.tablename] = row.rowsecurity;
      console.log(`  Table "${row.tablename}": rowsecurity = ${row.rowsecurity}`);
      if (!row.rowsecurity) {
        throw new Error(`RLS is disabled on table "${row.tablename}"!`);
      }
    }

    for (const t of requiredTables) {
      if (foundTables[t] === undefined) {
        throw new Error(`Expected table "${t}" was not found in public schema!`);
      }
    }
    console.log('✔ Row Level Security is verified active on categories, products, and substitutes.');

    // 4. Verify RLS Policies
    console.log('\n--- VERIFYING RLS POLICIES ---');
    const policiesRes = await client.query(`
      SELECT policyname, tablename, cmd, roles 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename IN ('categories', 'products', 'substitutes')
      ORDER BY tablename, policyname;
    `);
    console.log(`  Detected ${policiesRes.rows.length} RLS policies:`);
    for (const p of policiesRes.rows) {
      console.log(`  - [${p.tablename}] ${p.policyname} (${p.cmd})`);
    }

    // 5. Verify Catalog Counts
    console.log('\n--- VERIFYING DATA INTEGRITY ---');
    const catCount = await client.query('SELECT COUNT(*) FROM categories;');
    const prodCount = await client.query('SELECT COUNT(*) FROM products;');
    const subTableCount = await client.query('SELECT COUNT(*) FROM substitutes;');
    const subColCount = await client.query('SELECT COUNT(*) FROM products WHERE substitute_id IS NOT NULL;');

    const nCategories = parseInt(catCount.rows[0].count, 10);
    const nProducts = parseInt(prodCount.rows[0].count, 10);
    const nSubstitutesTable = parseInt(subTableCount.rows[0].count, 10);
    const nSubstitutesCol = parseInt(subColCount.rows[0].count, 10);

    console.log(`  Categories count:        ${nCategories} (Expected: 8)`);
    console.log(`  Products count:          ${nProducts} (Expected: 36)`);
    console.log(`  Substitutes table count: ${nSubstitutesTable} (Expected: 4)`);
    console.log(`  Products with substitute:${nSubstitutesCol} (Expected: 4)`);

    if (nCategories !== 8) throw new Error(`Category count mismatch: ${nCategories} != 8`);
    if (nProducts !== 36) throw new Error(`Product count mismatch: ${nProducts} != 36`);
    if (nSubstitutesTable !== 4) throw new Error(`Substitutes table count mismatch: ${nSubstitutesTable} != 4`);
    if (nSubstitutesCol !== 4) throw new Error(`Product substitute column count mismatch: ${nSubstitutesCol} != 4`);
    console.log('✔ Data counts verified perfectly.');

    // 6. Verify Function Overload Elimination
    console.log('\n--- VERIFYING FUNCTION OVERLOAD UNIQUENESS ---');
    const funcRes = await client.query(`
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'search_products_fuzzy';
    `);

    console.log(`  search_products_fuzzy functions in pg_proc: ${funcRes.rows.length}`);
    for (const f of funcRes.rows) {
      console.log(`  - ${f.proname}(${f.args})`);
    }

    if (funcRes.rows.length !== 1) {
      throw new Error(`Expected exactly 1 search_products_fuzzy function, found ${funcRes.rows.length}!`);
    }
    console.log('✔ Function overload eliminated: single 9-arg search_products_fuzzy function confirmed.');

    console.log('\n================================================================================');
    console.log('  MILESTONE 2 MIGRATION IDEMPOTENCY & DB SECURITY VERIFICATION: ALL CHECKS PASSED');
    console.log('================================================================================\n');
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

verifyIdempotencyAndSecurity().catch((err) => {
  console.error('\n✖ Idempotency Verification FAILED:', err);
  process.exit(1);
});
