#!/usr/bin/env node

/**
 * Phase 6 (G6) Verification Script
 * Validates clean checkout build, regression suite, 10 consecutive full journeys,
 * latency profiling benchmark, TV app tests & bundling, and release documentation.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function run(command, args, cwd, label) {
  console.log(`\n▶ [Phase 6 Check] ${label}`);
  console.log(`  Directory: ${cwd}`);
  console.log(`  Command:   ${command} ${args.join(" ")}`);

  const res = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  if (res.status !== 0) {
    console.error(`  ✗ FAILED: ${label} (exit code ${res.status})`);
    failed++;
    process.exit(res.status || 1);
  }
  console.log(`  ✓ PASSED: ${label}`);
  passed++;
}

function checkFile(filePath, label) {
  if (existsSync(filePath)) {
    console.log(`  ✓ PASSED: ${label} exists`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: Missing ${label} at ${filePath}`);
    failed++;
    process.exit(1);
  }
}

console.log("══════════════════════════════════════════════════════");
console.log("  WatchMate AI: Phase 6 (G6) Release Candidate Verification");
console.log("══════════════════════════════════════════════════════\n");

// 1. Content Package Validation (3 educational lessons)
run("node", ["content/validate.mjs"], rootDir, "1. Content Package Validation");

// 2. Contracts Package Unit Tests (21 tests)
run("npm.cmd", ["test"], path.join(rootDir, "packages", "contracts"), "2. Contracts Package Unit Tests");

// 3. Backend Compilation & Full Test Suite (87 tests including 10-journey rehearsal)
run("npm.cmd", ["run", "build"], path.join(rootDir, "services", "api"), "3. Backend TypeScript Compilation");
run("npm.cmd", ["test"], path.join(rootDir, "services", "api"), "4. Backend Full Regression & 10-Journey Suite");

// 4. Latency & Token Measurements Benchmark
run("node", ["scripts/measure-latency.mjs"], rootDir, "5. Latency & Token Measurement Benchmark");

// 5. TV App Unit Tests (20 tests)
run("npm.cmd", ["test"], path.join(rootDir, "apps", "tv"), "6. TV App Unit Tests");

// 6. TV App TypeScript Compilation
run("npm.cmd", ["run", "typecheck"], path.join(rootDir, "apps", "tv"), "7. TV App TypeScript Diagnostics Check");

// 7. TV App Metro Android Bundle Verification
run("npm.cmd", ["run", "bundle:android", "--", "--max-workers", "2"], path.join(rootDir, "apps", "tv"), "8. TV App Metro Android Production JS Bundle");

// 8. Documentation & Release Candidate Artifacts Checks
console.log("\n▶ [Phase 6 Check] Release Documentation & Governance Assets");
checkFile(path.join(rootDir, "docs", "release-candidate-report.md"), "Release Candidate Report");
checkFile(path.join(rootDir, "docs", "operations.md"), "Operations Manual");
checkFile(path.join(rootDir, "docs", "testing.md"), "Testing & Evaluation Guide");
checkFile(path.join(rootDir, "infra", "template.yaml"), "AWS SAM Infrastructure Template");

console.log("\n══════════════════════════════════════════════════════");
console.log(`  ALL PHASE 6 (G6) CHECKS PASSED SUCCESSFULLY! (${passed} checks passed, 0 failed)`);
console.log("══════════════════════════════════════════════════════\n");
