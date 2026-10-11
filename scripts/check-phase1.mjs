import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function runStep(name, cmd, args, cwd) {
  console.log(`\n========================================`);
  console.log(`[Phase 1 Check] ${name}`);
  console.log(`CWD: ${cwd}`);
  console.log(`Command: ${cmd} ${args.join(" ")}`);
  console.log(`========================================`);

  const res = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  if (res.status !== 0) {
    console.error(`\nFAILED: ${name} (exit code: ${res.status})`);
    process.exit(res.status || 1);
  }
  console.log(`PASSED: ${name}`);
}

console.log("Starting WatchMate AI Phase 1 (G1) Verification Suite...\n");

// 1. Contracts build and tests
runStep(
  "Contracts Build & Unit Tests",
  npmCmd,
  ["test"],
  path.join(rootDir, "packages", "contracts")
);

// 2. Content package validation
runStep(
  "Content Package Integrity (Catalog, Transcripts, Captions, Rights)",
  "node",
  ["content/validate.mjs"],
  rootDir
);

// 3. Fastify API build and route tests
runStep(
  "API Backend Build & Route Tests",
  npmCmd,
  ["test"],
  path.join(rootDir, "services", "api")
);

// 4. TV App regression checks
runStep(
  "TV App Tests (Regression Check)",
  npmCmd,
  ["test"],
  path.join(rootDir, "apps", "tv")
);

runStep(
  "TV App Typecheck (Regression Check)",
  npmCmd,
  ["run", "typecheck"],
  path.join(rootDir, "apps", "tv")
);

console.log("\n========================================");
console.log("ALL PHASE 1 (G1) CHECKS PASSED SUCCESSFULLY!");
console.log("========================================\n");
