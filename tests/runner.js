#!/usr/bin/env node
/**
 * Master Automated Test Suite Runner
 * Egyptian Online Pharmacy Platform (صيدلية إلكترونية مصرية)
 *
 * Executes all 4 test tiers:
 * - Tier 1: Core Feature Coverage (Home, Categories, Search, Details, Cart, Math, Lang, Dark, Voice)
 * - Tier 2: Boundary & Corner Cases (Limits, 300 EGP Threshold, Tashkeel, Negative Qty)
 * - Tier 3: Cross-Feature Combinations (RTL Toggles, PDP-to-Cart Stepper, Substitute Swap, Cart Search, Voice Flow)
 * - Tier 4: Real-World Workload Scenarios (Hajj Ibrahim, Mariam, Karim Personas)
 *
 * Exit code semantics:
 * - 0: All tests passed successfully
 * - 1: One or more test assertions failed
 */

import { performance } from 'node:perf_hooks';
import { runTier1Tests } from './tier1-features.test.js';
import { runTier2Tests } from './tier2-boundary.test.js';
import { runTier3Tests } from './tier3-cross-feature.test.js';
import { runTier4Tests } from './tier4-workloads.test.js';
import { validateProductSafety } from './harness.js';
import { SYNTHETIC_PRODUCTS } from './fixtures/catalog.js';

// ANSI terminal color codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';

async function main() {
  const startTime = performance.now();

  console.log(`\n${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  EGYPTIAN ONLINE PHARMACY — AUTOMATED TEST SUITE RUNNER${RESET}`);
  console.log(`${DIM}  Target: Arabic RTL First • EGP Currency • Synthetic Medical Compliance${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}\n`);

  // Verify Synthetic Medical Catalog Safety First (Mandatory Baseline)
  console.log(`${BOLD}[SAFETY CHECK] Validating 14 Synthetic Catalog Products...${RESET}`);
  let catalogSafetyPassed = 0;
  for (const product of SYNTHETIC_PRODUCTS) {
    try {
      validateProductSafety(product);
      catalogSafetyPassed++;
    } catch (err) {
      console.error(`${RED}✖ Safety check failed for product ${product.id}:${RESET}`, err.message);
      process.exit(1);
    }
  }
  console.log(`  ${GREEN}✔${RESET} All ${catalogSafetyPassed} products verified: strictly synthetic, max order qty 5, zero dangerous drugs.\n`);

  // Execute Tiers
  const tiers = [
    { name: 'Tier 1: Feature Coverage (Home, Categories, Search, Details, Cart, Math, Lang, Dark, Voice)', runner: runTier1Tests },
    { name: 'Tier 2: Boundary & Corner Cases (Limits, 300 EGP Boundary, Tashkeel, Negatives)', runner: runTier2Tests },
    { name: 'Tier 3: Cross-Feature Integration Flows (RTL Flip, PDP Stepper, Substitute Swap, Cart Search, Voice Flow)', runner: runTier3Tests },
    { name: 'Tier 4: Real-World Workloads (Hajj Ibrahim, Mariam, Karim Personas)', runner: runTier4Tests }
  ];

  const tierSummaries = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const failureDetails = [];

  for (const tier of tiers) {
    console.log(`${BOLD}[RUN] ${tier.name}...${RESET}`);
    const results = await tier.runner();
    let passedCount = 0;
    let failedCount = 0;

    for (const r of results) {
      totalTests++;
      if (r.passed) {
        passedCount++;
        totalPassed++;
        console.log(`  ${GREEN}✔${RESET} ${DIM}${r.id}:${RESET} ${r.description}`);
      } else {
        failedCount++;
        totalFailed++;
        console.log(`  ${RED}✖${RESET} ${BOLD}${r.id}:${RESET} ${r.description}`);
        failureDetails.push({ tier: tier.name, ...r });
      }
    }

    tierSummaries.push({
      tier: tier.name.split(' (')[0],
      total: results.length,
      passed: passedCount,
      failed: failedCount
    });
    console.log('');
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Print Summary Table
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}  TEST SUITE EXECUTION SUMMARY${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${'Tier Name'.padEnd(35)} | ${'Total'.padStart(6)} | ${'Passed'.padStart(6)} | ${'Failed'.padStart(6)} | ${'Status'.padStart(8)}`);
  console.log('------------------------------------+--------+--------+--------+---------');

  for (const s of tierSummaries) {
    const statusText = s.failed === 0 ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    console.log(`${s.tier.padEnd(35)} | ${String(s.total).padStart(6)} | ${String(s.passed).padStart(6)} | ${String(s.failed).padStart(6)} | ${statusText.padStart(8)}`);
  }

  console.log('------------------------------------+--------+--------+--------+---------');
  console.log(`${'TOTAL ACCROSS ALL 4 TIERS'.padEnd(35)} | ${String(totalTests).padStart(6)} | ${String(totalPassed).padStart(6)} | ${String(totalFailed).padStart(6)} | ${totalFailed === 0 ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`.padStart(8)}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);

  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  console.log(`  Pass Rate : ${totalFailed === 0 ? GREEN : RED}${passRate}%${RESET}`);
  console.log(`  Duration  : ${durationMs}ms`);

  if (totalFailed > 0) {
    console.log(`\n${BOLD}${RED}FAILURE DETAILS (${totalFailed} failures):${RESET}`);
    for (const f of failureDetails) {
      console.log(`\n${RED}[FAIL] ${f.tier} -> ${f.id}: ${f.description}${RESET}`);
      console.error(f.error);
    }
    console.log(`\n${BOLD}${RED}RESULT: FAILED (Exit Code 1)${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`\n${BOLD}${GREEN}RESULT: ALL CHECKS PASSED (Exit Code 0)${RESET}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`${RED}Fatal unhandled runner exception:${RESET}`, err);
  process.exit(1);
});
