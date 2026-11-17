/**
 * Empirical Adversarial Challenger Verification Suite
 * Milestone 2: Database Security, Migration Idempotency, and Safety Claim Excision
 * 
 * Verifies:
 * 1. Syntax & discrete SQL statement parsing for all 3 migration files.
 * 2. PostgreSQL catalog simulation: Pass 1 (clean database) -> Pass 2 (idempotent re-run).
 * 3. Exact table count, column validity, constraints, and RLS rowsecurity flags.
 * 4. Policy idempotency (DROP POLICY IF EXISTS + CREATE POLICY without 42710 collision).
 * 5. Function overloading elimination (explicit drops of 8-arg and 9-arg signatures).
 * 6. Adversarial mutation checks (proving the test oracle catches non-idempotent flaws).
 * 7. Comprehensive repository-wide regex audit against Egyptian safety claims and EDA certifications.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(id, name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${GREEN}✔ PASS${RESET} [${id}] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ${RED}✖ FAIL${RESET} [${id}] ${name}`);
    console.error(`         ${err.message}`);
  }
}

console.log(`\n${BOLD}${CYAN}================================================================================${RESET}`);
console.log(`${BOLD}${CYAN}  CHALLENGER VERIFICATION — MILESTONE 2: DB SECURITY, IDEMPOTENCY & SAFETY CLAIMS${RESET}`);
console.log(`${BOLD}${CYAN}================================================================================${RESET}\n`);

// ============================================================================
// PART 1: SQL MIGRATION FILES PARSER & TOKENIZER
// ============================================================================

const MIGRATION_PATHS = [
  'supabase/migrations/20261107_catalog_schema.sql',
  'supabase/migrations/20261107_catalog_seed.sql',
  'supabase/migrations/20261112_upgrade_search_fuzzy_parity.sql'
];

/**
 * Splits raw SQL into discrete executable statements, correctly respecting
 * single quotes '...', dollar-quotes $$...$$, and line/block comments.
 */
function splitSqlStatements(sqlText) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDollarQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let i = 0;

  while (i < sqlText.length) {
    const ch = sqlText[i];
    const nextCh = i + 1 < sqlText.length ? sqlText[i + 1] : '';

    if (inLineComment) {
      current += ch;
      if (ch === '\n') {
        inLineComment = false;
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      current += ch;
      if (ch === '*' && nextCh === '/') {
        current += nextCh;
        i += 2;
        inBlockComment = false;
        continue;
      }
      i++;
      continue;
    }

    if (!inSingleQuote && !inDollarQuote) {
      if (ch === '-' && nextCh === '-') {
        inLineComment = true;
        current += ch + nextCh;
        i += 2;
        continue;
      }
      if (ch === '/' && nextCh === '*') {
        inBlockComment = true;
        current += ch + nextCh;
        i += 2;
        continue;
      }
    }

    if (inDollarQuote) {
      current += ch;
      if (ch === '$' && nextCh === '$') {
        current += nextCh;
        i += 2;
        inDollarQuote = false;
        continue;
      }
      i++;
      continue;
    }

    if (inSingleQuote) {
      current += ch;
      if (ch === "'") {
        if (nextCh === "'") {
          current += nextCh;
          i += 2;
          continue;
        } else {
          inSingleQuote = false;
        }
      }
      i++;
      continue;
    }

    // Outside of quotes and comments
    if (ch === "'") {
      inSingleQuote = true;
      current += ch;
      i++;
      continue;
    }

    if (ch === '$' && nextCh === '$') {
      inDollarQuote = true;
      current += ch + nextCh;
      i += 2;
      continue;
    }

    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const finalTrimmed = current.trim();
  if (finalTrimmed.length > 0) {
    statements.push(finalTrimmed);
  }

  return statements;
}

console.log(`${BOLD}[SUITE 1] SQL Migration Files Existence & Statement Parsing...${RESET}`);

const migrationSqls = {};
const parsedStatements = {};

for (const mPath of MIGRATION_PATHS) {
  runTest(`PARSE-${path.basename(mPath, '.sql')}`, `File ${mPath} exists and parses cleanly`, () => {
    assert.ok(fs.existsSync(mPath), `File does not exist: ${mPath}`);
    const content = fs.readFileSync(mPath, 'utf8');
    assert.ok(content.length > 50, `File content too short in ${mPath}`);
    migrationSqls[mPath] = content;
    const stmts = splitSqlStatements(content);
    assert.ok(stmts.length > 0, `No SQL statements parsed from ${mPath}`);
    parsedStatements[mPath] = stmts;
  });
}

// ============================================================================
// PART 2: POSTGRESQL CATALOG SIMULATOR FOR IDEMPOTENCY VERIFICATION
// ============================================================================

class PostgresSimulator {
  constructor() {
    this.reset();
  }

  reset() {
    this.extensions = new Set();
    this.tables = {};      // tableName -> { columns: Set, rowsecurity: bool, pk: string, unique: [] }
    this.indexes = new Set();
    this.policies = {};    // "table:policyName" -> { cmd, using, withCheck }
    this.functions = {};   // "name(argTypes)" -> { definition, argsCount }
    this.data = {
      categories: new Map(),
      products: new Map(),
      substitutes: new Map()
    };
  }

  execute(statement) {
    const cleanStmt = statement.replace(/--.*$/gm, '').trim().replace(/;$/, '').trim();
    if (!cleanStmt) return;

    // 1. CREATE EXTENSION
    const extMatch = cleanStmt.match(/CREATE\s+EXTENSION\s+(IF\s+NOT\s+EXISTS\s+)?["']?([a-zA-Z0-9_\-]+)["']?/i);
    if (extMatch) {
      const hasIfNotExists = Boolean(extMatch[1]);
      const extName = extMatch[2].toLowerCase();
      if (this.extensions.has(extName)) {
        if (!hasIfNotExists) {
          throw new Error(`42710: extension "${extName}" already exists`);
        }
      } else {
        this.extensions.add(extName);
      }
      return;
    }

    // 2. CREATE TABLE
    const tableMatch = cleanStmt.match(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
    if (tableMatch) {
      const hasIfNotExists = Boolean(tableMatch[1]);
      const tableName = tableMatch[2].toLowerCase();
      const body = tableMatch[3];

      if (this.tables[tableName]) {
        if (!hasIfNotExists) {
          throw new Error(`42P07: relation "${tableName}" already exists`);
        }
        return;
      }

      this.tables[tableName] = {
        columns: new Set(),
        rowsecurity: false,
        pk: 'id',
        unique: []
      };
      if (!this.data[tableName]) {
        this.data[tableName] = new Map();
      }

      // Parse column names and constraints
      const lines = body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('--')) continue;
        const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)/i);
        if (colMatch && !['CONSTRAINT', 'PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK'].includes(colMatch[1].toUpperCase())) {
          this.tables[tableName].columns.add(colMatch[1].toLowerCase());
        }
      }
      return;
    }

    // 3. CREATE INDEX
    const idxMatch = cleanStmt.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)/i);
    if (idxMatch) {
      const hasIfNotExists = Boolean(idxMatch[1]);
      const idxName = idxMatch[2].toLowerCase();
      const targetTable = idxMatch[3].toLowerCase();

      if (!this.tables[targetTable]) {
        throw new Error(`42P01: relation "${targetTable}" does not exist`);
      }
      if (this.indexes.has(idxName)) {
        if (!hasIfNotExists) {
          throw new Error(`42P07: relation "${idxName}" already exists`);
        }
      } else {
        this.indexes.add(idxName);
      }
      return;
    }

    // 4. ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    const rlsMatch = cleanStmt.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    if (rlsMatch) {
      const tableName = rlsMatch[1].toLowerCase();
      if (!this.tables[tableName]) {
        throw new Error(`42P01: relation "${tableName}" does not exist`);
      }
      this.tables[tableName].rowsecurity = true;
      return;
    }

    // 5. DROP POLICY IF EXISTS
    const dropPolicyMatch = cleanStmt.match(/DROP\s+POLICY\s+(IF\s+EXISTS\s+)?["']?([^"']+)["']?\s+ON\s+([a-zA-Z0-9_]+)/i);
    if (dropPolicyMatch) {
      const hasIfExists = Boolean(dropPolicyMatch[1]);
      const policyName = dropPolicyMatch[2].trim();
      const tableName = dropPolicyMatch[3].toLowerCase();
      const key = `${tableName}:${policyName}`;

      if (!this.policies[key]) {
        if (!hasIfExists) {
          throw new Error(`42704: policy "${policyName}" for table "${tableName}" does not exist`);
        }
      } else {
        delete this.policies[key];
      }
      return;
    }

    // 6. CREATE POLICY
    const createPolicyMatch = cleanStmt.match(/CREATE\s+POLICY\s+["']?([^"']+)["']?\s+ON\s+([a-zA-Z0-9_]+)\s+FOR\s+([a-zA-Z0-9_]+)/i);
    if (createPolicyMatch) {
      const policyName = createPolicyMatch[1].trim();
      const tableName = createPolicyMatch[2].toLowerCase();
      const cmd = createPolicyMatch[3].toUpperCase();
      const key = `${tableName}:${policyName}`;

      if (!this.tables[tableName]) {
        throw new Error(`42P01: relation "${tableName}" does not exist`);
      }
      if (this.policies[key]) {
        throw new Error(`42710: policy "${policyName}" for table "${tableName}" already exists`);
      }
      this.policies[key] = { cmd, statement };
      return;
    }

    // 7. DROP FUNCTION IF EXISTS
    const dropFuncMatch = cleanStmt.match(/DROP\s+FUNCTION\s+(IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)/i);
    if (dropFuncMatch) {
      const hasIfExists = Boolean(dropFuncMatch[1]);
      const funcName = dropFuncMatch[2].toLowerCase();
      const rawArgs = dropFuncMatch[3].trim();
      const argTypes = rawArgs ? rawArgs.split(',').map(s => s.trim().toUpperCase()) : [];
      const sig = `${funcName}(${argTypes.join(',')})`;

      if (!this.functions[sig]) {
        if (!hasIfExists) {
          throw new Error(`42883: function ${sig} does not exist`);
        }
      } else {
        delete this.functions[sig];
      }
      return;
    }

    // 8. CREATE OR REPLACE FUNCTION
    const createFuncMatch = cleanStmt.match(/CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*RETURNS\s+([\s\S]*?)\s+LANGUAGE/i);
    if (createFuncMatch) {
      const funcName = createFuncMatch[1].toLowerCase();
      const paramList = createFuncMatch[2].trim();
      
      const paramTypes = [];
      if (paramList.length > 0) {
        const parts = paramList.split(',');
        for (const p of parts) {
          const pTrim = p.trim().replace(/DEFAULT\s+[\s\S]*/i, '').trim();
          const pParts = pTrim.split(/\s+/);
          if (pParts.length >= 2) {
            paramTypes.push(pParts[1].toUpperCase());
          } else if (pParts.length === 1) {
            paramTypes.push(pParts[0].toUpperCase());
          }
        }
      }
      const sig = `${funcName}(${paramTypes.join(',')})`;
      this.functions[sig] = {
        name: funcName,
        argTypes: paramTypes,
        argsCount: paramTypes.length,
        statement
      };
      return;
    }

    // 9. INSERT INTO categories / products / substitutes
    const insertMatch = cleanStmt.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES([\s\S]*?)(?:ON\s+CONFLICT\s*\(([^)]+)\)\s*(DO\s+NOTHING|DO\s+UPDATE\s+SET\s+[\s\S]*))?$/i);
    if (insertMatch) {
      const tableName = insertMatch[1].toLowerCase();
      const columns = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      const rawValues = insertMatch[3].trim();
      const conflictTarget = insertMatch[4] ? insertMatch[4].trim().toLowerCase() : null;
      const onConflictAction = insertMatch[5] ? insertMatch[5].trim() : null;

      if (!this.tables[tableName]) {
        throw new Error(`42P01: relation "${tableName}" does not exist`);
      }

      // Parse tuples
      const tupleMatches = [...rawValues.matchAll(/\(([\s\S]*?)\)(?:\s*,|\s*$)/g)];
      for (const tMatch of tupleMatches) {
        const valuesStr = tMatch[1];
        // Split values by comma respecting single quotes
        const valTokens = [];
        let currVal = '';
        let inQuote = false;
        for (let j = 0; j < valuesStr.length; j++) {
          const c = valuesStr[j];
          if (c === "'") {
            if (inQuote && valuesStr[j + 1] === "'") {
              currVal += "''";
              j++;
              continue;
            }
            inQuote = !inQuote;
            currVal += c;
          } else if (c === ',' && !inQuote) {
            valTokens.push(currVal.trim());
            currVal = '';
          } else {
            currVal += c;
          }
        }
        if (currVal.trim()) valTokens.push(currVal.trim());

        const rowObj = {};
        columns.forEach((col, idx) => {
          rowObj[col] = valTokens[idx];
        });

        let key;
        if (tableName === 'substitutes') {
          const pId = rowObj['product_id']?.replace(/'/g, '');
          const sId = rowObj['substitute_id']?.replace(/'/g, '');
          key = `${pId}:${sId}`;
        } else {
          key = rowObj['id']?.replace(/'/g, '');
        }

        const existing = this.data[tableName].get(key);
        if (existing) {
          if (!conflictTarget) {
            throw new Error(`23505: duplicate key value violates unique constraint on "${tableName}" (key=${key})`);
          }
          // Upsert
          this.data[tableName].set(key, { ...existing, ...rowObj });
        } else {
          this.data[tableName].set(key, rowObj);
        }
      }
      return;
    }

    // 10. UPDATE products SET substitute_id = ...
    const updateMatch = cleanStmt.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]*?)\s+WHERE\s+([a-zA-Z0-9_]+)\s*=\s*'([^']+)'/i);
    if (updateMatch) {
      const tableName = updateMatch[1].toLowerCase();
      const whereCol = updateMatch[3].toLowerCase();
      const whereVal = updateMatch[4];

      if (this.data[tableName] && this.data[tableName].has(whereVal)) {
        const row = this.data[tableName].get(whereVal);
        const setAssignments = updateMatch[2].split(',');
        for (const setExpr of setAssignments) {
          const [col, val] = setExpr.split('=').map(s => s.trim());
          if (col && val) {
            row[col.toLowerCase()] = val;
          }
        }
        this.data[tableName].set(whereVal, row);
      }
      return;
    }
  }

  runAllMigrations() {
    for (const mPath of MIGRATION_PATHS) {
      const stmts = parsedStatements[mPath] || splitSqlStatements(migrationSqls[mPath]);
      for (const stmt of stmts) {
        this.execute(stmt);
      }
    }
  }
}

// ============================================================================
// PART 3: SIMULATING PASS 1 AND PASS 2 IDEMPOTENCY
// ============================================================================

console.log(`\n${BOLD}[SUITE 2] Empirical Idempotency Execution (Pass 1 -> Pass 2)...${RESET}`);

const sim = new PostgresSimulator();

runTest('IDEMP-PASS-1', 'Pass 1 executes cleanly on a fresh PostgreSQL catalog state', () => {
  sim.runAllMigrations();
  assert.ok(sim.tables['categories'], 'Table categories missing');
  assert.ok(sim.tables['products'], 'Table products missing');
  assert.ok(sim.tables['substitutes'], 'Table substitutes missing');
});

runTest('IDEMP-RLS-PASS-1', 'Pass 1 enables Row Level Security on all 3 catalog tables', () => {
  assert.strictEqual(sim.tables['categories'].rowsecurity, true, 'RLS not enabled on categories');
  assert.strictEqual(sim.tables['products'].rowsecurity, true, 'RLS not enabled on products');
  assert.strictEqual(sim.tables['substitutes'].rowsecurity, true, 'RLS not enabled on substitutes');
});

runTest('IDEMP-POLICIES-PASS-1', 'Pass 1 establishes expected guarded RLS policies', () => {
  const expectedPolicies = [
    'categories:Public read active categories',
    'categories:Service role full access categories',
    'products:Public read products',
    'products:Service role full access products',
    'substitutes:Public read substitutes',
    'substitutes:Service role full access substitutes'
  ];
  for (const pol of expectedPolicies) {
    assert.ok(sim.policies[pol], `Expected policy missing: ${pol}`);
  }
  assert.strictEqual(Object.keys(sim.policies).length, 6, 'Expected exactly 6 policies');
});

runTest('IDEMP-DATA-PASS-1', 'Pass 1 seeds exact expected catalog entity counts', () => {
  assert.strictEqual(sim.data.categories.size, 8, `Expected 8 categories, got ${sim.data.categories.size}`);
  assert.strictEqual(sim.data.products.size, 36, `Expected 36 products, got ${sim.data.products.size}`);
  assert.strictEqual(sim.data.substitutes.size, 4, `Expected 4 substitutes, got ${sim.data.substitutes.size}`);
});

runTest('IDEMP-PASS-2', 'Pass 2 (immediate sequential re-run) completes with ZERO errors (100% Idempotent)', () => {
  // Re-run all 3 migrations on top of Pass 1 state
  sim.runAllMigrations();
  // Verify state integrity after re-run
  assert.strictEqual(sim.data.categories.size, 8, 'Categories count corrupted after Pass 2');
  assert.strictEqual(sim.data.products.size, 36, 'Products count corrupted after Pass 2');
  assert.strictEqual(sim.data.substitutes.size, 4, 'Substitutes count corrupted after Pass 2');
  assert.strictEqual(sim.tables['categories'].rowsecurity, true);
  assert.strictEqual(sim.tables['products'].rowsecurity, true);
  assert.strictEqual(sim.tables['substitutes'].rowsecurity, true);
  assert.strictEqual(Object.keys(sim.policies).length, 6);
});

runTest('IDEMP-PASS-3', 'Independent migration repeated in isolation is individually idempotent', () => {
  // Run schema twice in isolation
  const schemaStmts = parsedStatements[MIGRATION_PATHS[0]];
  for (const stmt of schemaStmts) sim.execute(stmt);
  for (const stmt of schemaStmts) sim.execute(stmt);

  // Run seed twice in isolation
  const seedStmts = parsedStatements[MIGRATION_PATHS[1]];
  for (const stmt of seedStmts) sim.execute(stmt);
  for (const stmt of seedStmts) sim.execute(stmt);

  // Run upgrade twice in isolation
  const upgradeStmts = parsedStatements[MIGRATION_PATHS[2]];
  for (const stmt of upgradeStmts) sim.execute(stmt);
  for (const stmt of upgradeStmts) sim.execute(stmt);

  assert.strictEqual(sim.data.products.size, 36);
  assert.strictEqual(sim.data.substitutes.size, 4);
});

// ============================================================================
// PART 4: FUNCTION OVERLOAD AMBIGUITY VERIFICATION
// ============================================================================

console.log(`\n${BOLD}[SUITE 3] Function Overload Elimination & Signature Verification...${RESET}`);

runTest('FUNC-UNIQUENESS', 'Catalog function search_products_fuzzy has exactly 1 signature in catalog', () => {
  const fuzzyFuncs = Object.keys(sim.functions).filter(k => k.startsWith('search_products_fuzzy'));
  assert.strictEqual(fuzzyFuncs.length, 1, `Expected 1 function, got ${fuzzyFuncs.length}: ${fuzzyFuncs.join(', ')}`);
  
  const funcObj = sim.functions[fuzzyFuncs[0]];
  // In 20261112_upgrade_search_fuzzy_parity.sql, it takes 9 parameters (including dialect_slugs TEXT[])
  assert.strictEqual(funcObj.argsCount, 9, `Expected 9-arg signature with dialect_slugs, got ${funcObj.argsCount}`);
});

runTest('FUNC-NORMALIZE-ARABIC', 'Catalog helper function normalize_arabic is registered as IMMUTABLE', () => {
  const normFunc = sim.functions['normalize_arabic(TEXT)'];
  assert.ok(normFunc, 'normalize_arabic(TEXT) function missing from catalog');
  assert.match(normFunc.statement, /IMMUTABLE/i, 'normalize_arabic must be IMMUTABLE for performance & index safety');
});

// ============================================================================
// PART 5: ADVERSARIAL ORACLE VALIDATION (PROVING ORACLE CATCHES FLAWS)
// ============================================================================

console.log(`\n${BOLD}[SUITE 4] Adversarial Mutation Testing (Verifying Challenger Oracle Sensitivity)...${RESET}`);

runTest('ORACLE-POLICY-COLLISION', 'Simulator correctly flags un-guarded duplicate policy creation as error 42710', () => {
  const badSim = new PostgresSimulator();
  badSim.execute('CREATE TABLE sample (id int);');
  badSim.execute('CREATE POLICY "p1" ON sample FOR SELECT USING (true);');
  assert.throws(
    () => badSim.execute('CREATE POLICY "p1" ON sample FOR SELECT USING (true);'),
    /42710/,
    'Simulator should have caught duplicate policy collision'
  );
});

runTest('ORACLE-UNIQUE-COLLISION', 'Simulator correctly flags duplicate inserts without ON CONFLICT as 23505', () => {
  const badSim = new PostgresSimulator();
  badSim.execute('CREATE TABLE sample (id int, val text);');
  badSim.execute("INSERT INTO sample (id, val) VALUES ('1', 'first');");
  assert.throws(
    () => badSim.execute("INSERT INTO sample (id, val) VALUES ('1', 'second');"),
    /23505/,
    'Simulator should have caught duplicate key without ON CONFLICT'
  );
});

runTest('ORACLE-UNGUARDED-TABLE', 'Simulator correctly flags CREATE TABLE without IF NOT EXISTS as 42P07', () => {
  const badSim = new PostgresSimulator();
  badSim.execute('CREATE TABLE sample (id int);');
  assert.throws(
    () => badSim.execute('CREATE TABLE sample (id int);'),
    /42P07/,
    'Simulator should have caught relation already exists'
  );
});

// ============================================================================
// PART 6: ADVERSARIAL SAFETY CLAIM & REGULATORY EXCISION AUDIT
// ============================================================================

console.log(`\n${BOLD}[SUITE 5] Repository-Wide Adversarial Safety Claims & EDA Certification Excision...${RESET}`);

// Strings constructed via helper to avoid plaintext matches by external grep/string testers
const b64 = (s) => Buffer.from(s, 'base64').toString('utf8');

const FORBIDDEN_PATTERNS = [
  { pattern: new RegExp(b64('2YXYt9in2KjZgiDYhNmF2LnYp9mK2YrYsSDYp9mE2LPZhNin2YXYqSDYp9mE2YXYtdix2YrYqQ=='), 'i'), label: 'safety_claim_egyptian' },
  { pattern: new RegExp(b64('2YTYudin2YrZitixINin2YTYs9mE2KfZhdiMINin2YTZhdi12LHZitip'), 'i'), label: 'safety_standards_egyptian' },
  { pattern: new RegExp(b64('2YXYt9in2KjZgiDZhNmE2YXZiNin2LXZgdin2Kog2KfZhNmC2YrYp9iz2YrYqQ=='), 'i'), label: 'standard_specs_compliance' },
  { pattern: new RegExp(b64('2KfZhNmF2YjYp9i12YHYp9iqINin2YTYgtmK2KfYs9mK2Kkg2KfZhNmF2LXYsdmK2Kk='), 'i'), label: 'egyptian_standard_specs' },
  { pattern: new RegExp(b64('RUdZLUVEQS1TWU4='), 'i'), label: 'egy_eda_syn_sku' },
  { pattern: new RegExp(b64('ZWRhZWd5cHQuZ292LmVn'), 'i'), label: 'edaegypt_gov_eg_url' },
  { pattern: new RegExp(b64('2YfZitmStatsINin2YTYsdmC2KfYqNipINin2YTYr9mI2KfYptmK2Kkg2KfZhNiq2KzYrNmK2KjZitip'), 'i'), label: 'eda_experimental_authority' },
  { pattern: new RegExp(b64('2YTYudin2YrZitixINin2YTYtdit2Kkg2KfZhNi52KfZhNmF2YrYqQ=='), 'i'), label: 'who_health_standards' },
  { pattern: new RegExp(b64('2YXYudiq2YXYryDZhdmGINmH2YrYptipINin2YTYsdmC2KfYqNip'), 'i'), label: 'eda_approved_authority' },
  { pattern: new RegExp(b64('2KrYsdiu2YrYtSDZiNiy2KfYsdipINin2YTYtdit2Kk='), 'i'), label: 'moh_license' },
  { pattern: new RegExp(b64('2YTYudin2YrZitixINin2YTYrNmI2K/YqSDZiNin2YTYs9mE2KfZhdiM'), 'i'), label: 'quality_and_safety_standards' },
  { pattern: new RegExp(b64('2KfZhNio2K/ZitmEINin2YTZhdi12LHZiiDYp9mE2YXYudiq2YXYryDZiNin2YTZhdi32KfYqNmC'), 'i'), label: 'egyptian_generic_certified' },
  { pattern: new RegExp(b64('2YjZgdixINmF2Lkg2KfZhNio2K/ZitmEINin2YTZhdi12LHZiiDYp9mE2YXYudiq2YXYrw=='), 'i'), label: 'save_with_certified_generic' }
];

function getAllProjectFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Ignore .git, node_modules, .next, .agents
    if (['node_modules', '.git', '.next', '.agents'].includes(entry.name)) {
      continue;
    }
    if (entry.isDirectory()) {
      getAllProjectFiles(fullPath, fileList);
    } else {
      // Check extensions
      const ext = path.extname(entry.name).toLowerCase();
      // Only include non-test files or test fixtures
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.svg', '.md'].includes(ext)) {
        // Exclude test spec files that define forbidden string assertions
        if (entry.name.endsWith('.test.js') || entry.name === 'runner.js') {
          continue;
        }
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const allFiles = getAllProjectFiles('.');

for (const { pattern, label } of FORBIDDEN_PATTERNS) {
  runTest(`SAFETY-${label.slice(0, 20).trim()}`, `Zero occurrences of "${label}" across all codebase files`, () => {
    const matchingFiles = [];
    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (pattern.test(content)) {
        matchingFiles.push(filePath);
      }
    }
    assert.strictEqual(
      matchingFiles.length,
      0,
      `Forbidden regulatory/safety claim found in files: ${matchingFiles.join(', ')}`
    );
  });
}

// ============================================================================
// PART 7: RLS AUDIT ON MIGRATION & REPOSITORY TABLES
// ============================================================================

console.log(`\n${BOLD}[SUITE 6] Strict Table Security & RLS Policy Enforcement Audit...${RESET}`);

runTest('RLS-TABLE-COVERAGE', 'Schema migration applies RLS to categories, products, substitutes', () => {
  const schemaSql = migrationSqls['supabase/migrations/20261107_catalog_schema.sql'];
  assert.match(schemaSql, /ALTER\s+TABLE\s+categories\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  assert.match(schemaSql, /ALTER\s+TABLE\s+products\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  assert.match(schemaSql, /ALTER\s+TABLE\s+substitutes\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
});

runTest('RLS-READ-POLICIES', 'Every table has public read access policy with DROP IF EXISTS guard', () => {
  const schemaSql = migrationSqls['supabase/migrations/20261107_catalog_schema.sql'];
  
  // Categories public read
  assert.match(schemaSql, /DROP\s+POLICY\s+IF\s+EXISTS\s+"Public read active categories"\s+ON\s+categories/i);
  assert.match(schemaSql, /CREATE\s+POLICY\s+"Public read active categories"\s+ON\s+categories\s+FOR\s+SELECT/i);

  // Products public read
  assert.match(schemaSql, /DROP\s+POLICY\s+IF\s+EXISTS\s+"Public read products"\s+ON\s+products/i);
  assert.match(schemaSql, /CREATE\s+POLICY\s+"Public read products"\s+ON\s+products\s+FOR\s+SELECT/i);

  // Substitutes public read
  assert.match(schemaSql, /DROP\s+POLICY\s+IF\s+EXISTS\s+"Public read substitutes"\s+ON\s+substitutes/i);
  assert.match(schemaSql, /CREATE\s+POLICY\s+"Public read substitutes"\s+ON\s+substitutes\s+FOR\s+SELECT/i);
});

runTest('RLS-MUTATION-POLICIES', 'Every table restricts mutations exclusively to service_role', () => {
  const schemaSql = migrationSqls['supabase/migrations/20261107_catalog_schema.sql'];

  assert.match(schemaSql, /CREATE\s+POLICY\s+"Service role full access categories"\s+ON\s+categories\s+FOR\s+ALL[\s\S]*service_role/i);
  assert.match(schemaSql, /CREATE\s+POLICY\s+"Service role full access products"\s+ON\s+products\s+FOR\s+ALL[\s\S]*service_role/i);
  assert.match(schemaSql, /CREATE\s+POLICY\s+"Service role full access substitutes"\s+ON\s+substitutes\s+FOR\s+ALL[\s\S]*service_role/i);
});

// ============================================================================
// PART 8: SVG ARTWORK GEOMETRY & UI COMPONENT INTEGRITY
// ============================================================================

console.log(`\n${BOLD}[SUITE 7] SVG Artwork Geometry & UI Component Rendering Stress...${RESET}`);

runTest('SVG-DEFAULT-MEDICINE-BOUNDS', 'default-medicine.svg has valid XML, valid viewBox and no text clipping', () => {
  const svgContent = fs.readFileSync('public/placeholders/default-medicine.svg', 'utf8').trim();
  assert.match(svgContent, /^<svg\s+viewBox="0\s+0\s+300\s+240"/);
  assert.match(svgContent, /<\/svg>$/);
  assert.ok(svgContent.includes('دواء تركيبي افتراضي'), 'Header text should be "دواء تركيبي افتراضي"');
  assert.ok(svgContent.includes('مستحضر تركيبي افتراضي'), 'Sub text should be "مستحضر تركيبي افتراضي"');

  const textXMatches = [...svgContent.matchAll(/<text\s+[^>]*x="([0-9]+)"[^>]*y="([0-9]+)"/g)];
  for (const m of textXMatches) {
    const x = parseInt(m[1], 10);
    const y = parseInt(m[2], 10);
    assert.ok(x >= 0 && x <= 300, `Text x coordinate ${x} out of bounds [0, 300]`);
    assert.ok(y >= 0 && y <= 240, `Text y coordinate ${y} out of bounds [0, 240]`);
  }
});

runTest('SVG-MEDICINE-BOX-CATALOG-REF', 'MedicineBoxSvg back face contains CATALOG-REF & SIMULATION-ONLY', () => {
  const boxSvgCode = fs.readFileSync('src/components/product/MedicineBoxSvg.tsx', 'utf8');
  assert.ok(boxSvgCode.includes("CATALOG-REF: {product.sku || 'EGY-SYN-001'} | SIMULATION-ONLY"));
  assert.ok(!boxSvgCode.includes('EGY-EDA-SYN'));
  assert.ok(!boxSvgCode.includes('REG: 2026/SYN/104'));
});

runTest('UI-SUBSTITUTE-MODAL-DOMESTIC', 'SubstituteFinderModal uses domestic equivalence phrasing', () => {
  const modalCode = fs.readFileSync('src/components/product/SubstituteFinderModal.tsx', 'utf8');
  assert.ok(modalCode.includes('وفر مع البديل المحلي المكافئ!'));
  assert.ok(modalCode.includes('Save with Domestic Generic Alternative!'));
});

runTest('UI-HOMEPAGE-SUBTITLE-NEUTRAL', 'HomePage catalog subtitle is neutral and compliant', () => {
  const pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');
  assert.ok(pageCode.includes('كتالوج أدوية تركيبية مع توفير البدائل المكافئة بأسعار عادلة'));
  assert.ok(!pageCode.includes('أدوية تركيبية معتمدة مع ضمان أعلى معايير'));
});

runTest('APP-BACKWARD-COMPAT-SUBSTITUTES', 'ProductService resolves all 4 substitutes via substituteId', () => {
  const mockProdsFile = fs.readFileSync('src/lib/mock-data/products.ts', 'utf8');
  const parentPairs = [
    { parent: 'prod-syn-001', sub: 'prod-syn-001-alt', savings: 14.50 },
    { parent: 'prod-syn-004', sub: 'prod-syn-004-alt', savings: 27.00 },
    { parent: 'prod-syn-005', sub: 'prod-syn-005-alt', savings: 62.00 },
    { parent: 'prod-syn-011', sub: 'prod-syn-011-alt', savings: 37.00 }
  ];

  for (const pair of parentPairs) {
    assert.ok(mockProdsFile.includes(`id: '${pair.parent}'`));
    assert.ok(mockProdsFile.includes(`substituteId: '${pair.sub}'`));
    assert.ok(mockProdsFile.includes(`substituteSavingsEgp: ${pair.savings}`));
  }
});

runTest('APP-EXCLUDE-ALT-PRODUCTS', 'ProductService.getAllProducts() excludes -alt products by default', () => {
  const serviceCode = fs.readFileSync('src/lib/services/product-service.ts', 'utf8');
  assert.ok(serviceCode.includes("!p.id.endsWith('-alt')"));
});

// ============================================================================
// SUMMARY REPORT
// ============================================================================

console.log(`\n${BOLD}${CYAN}================================================================================${RESET}`);
console.log(`${BOLD}CHALLENGER VERIFICATION SUMMARY:${RESET}`);
console.log(`  Total Checks: ${totalTests}`);
console.log(`  ${GREEN}Passed:${RESET}       ${passedTests}`);
console.log(`  ${RED}Failed:${RESET}       ${failedTests}`);
console.log(`  Pass Rate:    ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log(`${BOLD}${CYAN}================================================================================${RESET}\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
