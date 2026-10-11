#!/usr/bin/env node

/**
 * Phase 5 (G5) Verification Script
 * Validates hosted reliability, session auth, quota enforcement, kill switch,
 * safe logging, infrastructure template, and operational documentation.
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${label}`);
    console.log(`    → ${err.message}`);
    failed++;
  }
}

function assertExists(filePath, description) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing: ${description} (${filePath})`);
  }
}

console.log("═══ Phase 5 (G5) Verification ═══\n");

// ── 1. Infrastructure Template ──────────────────────────────────────
console.log("1. Infrastructure Template (SAM/CloudFormation):");

check("template.yaml exists", () => {
  assertExists(path.join(root, "infra", "template.yaml"), "SAM template");
});

check("template.yaml defines API Gateway, Lambda, DynamoDB, S3, CloudFront", () => {
  const template = readFileSync(path.join(root, "infra", "template.yaml"), "utf-8");
  const required = [
    "AWS::Serverless::HttpApi",
    "AWS::Serverless::Function",
    "AWS::DynamoDB::Table",
    "AWS::S3::Bucket",
    "AWS::CloudFront::Distribution",
    "AWS::CloudFront::OriginAccessControl",
  ];
  for (const resource of required) {
    if (!template.includes(resource)) {
      throw new Error(`Missing resource type: ${resource}`);
    }
  }
});

check("template.yaml has AI_KILL_SWITCH parameter", () => {
  const template = readFileSync(path.join(root, "infra", "template.yaml"), "utf-8");
  if (!template.includes("AiKillSwitch")) {
    throw new Error("Missing AiKillSwitch parameter");
  }
});

check("template.yaml has evaluation access code hash parameter", () => {
  const template = readFileSync(path.join(root, "infra", "template.yaml"), "utf-8");
  if (!template.includes("EvaluationAccessCodeHash")) {
    throw new Error("Missing EvaluationAccessCodeHash parameter");
  }
});

check("template.yaml uses least-privilege IAM (scoped Bedrock + DynamoDB)", () => {
  const template = readFileSync(path.join(root, "infra", "template.yaml"), "utf-8");
  if (!template.includes("bedrock:InvokeModel") || !template.includes("DynamoDBCrudPolicy")) {
    throw new Error("Missing scoped IAM policies");
  }
});

check("template.yaml exports API URL and CDN domain", () => {
  const template = readFileSync(path.join(root, "infra", "template.yaml"), "utf-8");
  if (!template.includes("HttpApiUrl") || !template.includes("CloudFrontDomain")) {
    throw new Error("Missing output exports");
  }
});

// ── 2. DynamoDB Store Implementations ────────────────────────────────
console.log("\n2. DynamoDB Store Implementations:");

check("dynamo-session-store.ts exists", () => {
  assertExists(path.join(root, "services", "api", "src", "dynamo-session-store.ts"), "DynamoDB session store");
});

check("dynamo-quota-manager.ts exists", () => {
  assertExists(path.join(root, "services", "api", "src", "dynamo-quota-manager.ts"), "DynamoDB quota manager");
});

check("Lambda handler uses DynamoDB stores", () => {
  const lambda = readFileSync(path.join(root, "services", "api", "src", "lambda.ts"), "utf-8");
  if (!lambda.includes("DynamoSessionStore") || !lambda.includes("DynamoQuotaManager")) {
    throw new Error("Lambda handler does not use DynamoDB stores");
  }
});

// ── 3. Auth Middleware ──────────────────────────────────────────────
console.log("\n3. Auth & Session Enforcement:");

check("auth.ts has session store interface and exchange route", () => {
  const auth = readFileSync(path.join(root, "services", "api", "src", "auth.ts"), "utf-8");
  if (!auth.includes("SessionStore") || !auth.includes("/v1/auth/exchange")) {
    throw new Error("Missing session store or exchange route");
  }
});

check("app.ts integrates auth middleware for AI endpoints", () => {
  const app = readFileSync(path.join(root, "services", "api", "src", "app.ts"), "utf-8");
  if (!app.includes("validateSession") || !app.includes("UNAUTHORIZED")) {
    throw new Error("Missing auth middleware in app.ts");
  }
});

check("app.ts integrates quota middleware for AI endpoints", () => {
  const app = readFileSync(path.join(root, "services", "api", "src", "app.ts"), "utf-8");
  if (!app.includes("checkAndConsumeQuota") || !app.includes("TOO_MANY_REQUESTS")) {
    throw new Error("Missing quota middleware in app.ts");
  }
});

check("app.ts integrates kill switch enforcement", () => {
  const app = readFileSync(path.join(root, "services", "api", "src", "app.ts"), "utf-8");
  if (!app.includes("AI_SERVICE_DISABLED") || !app.includes("GLOBAL_KILL_SWITCH")) {
    throw new Error("Missing kill switch enforcement in app.ts");
  }
});

// ── 4. Safe Operational Logging ─────────────────────────────────────
console.log("\n4. Safe Operational Logging:");

check("logger.ts hashes session IDs and prevents privacy leakage", () => {
  const logger = readFileSync(path.join(root, "services", "api", "src", "logger.ts"), "utf-8");
  if (!logger.includes("sha256") || !logger.includes("slice(0, 16)")) {
    throw new Error("Logger does not hash session IDs");
  }
});

check("app.ts wires operational logging on AI responses", () => {
  const app = readFileSync(path.join(root, "services", "api", "src", "app.ts"), "utf-8");
  if (!app.includes("logOperation") || !app.includes("onResponse")) {
    throw new Error("Missing operational logging hook in app.ts");
  }
});

// ── 5. Documentation ──────────────────────────────────────────────
console.log("\n5. Operational Documentation:");

check("infra/README.md with deployment and rollback commands", () => {
  const readme = readFileSync(path.join(root, "infra", "README.md"), "utf-8");
  if (!readme.includes("sam deploy") || !readme.includes("Rollback")) {
    throw new Error("Missing deployment or rollback instructions");
  }
});

check("docs/operations.md exists", () => {
  assertExists(path.join(root, "docs", "operations.md"), "Operations runbook");
});

check("docs/testing.md exists", () => {
  assertExists(path.join(root, "docs", "testing.md"), "Testing guide");
});

// ── 6. Backend Tests ────────────────────────────────────────────────
console.log("\n6. Backend Test Suites:");

try {
  console.log("  Building services/api...");
  execSync("npm.cmd run build", {
    cwd: path.join(root, "services", "api"),
    stdio: "pipe",
  });
  console.log("  ✓ TypeScript build succeeded");
  passed++;
} catch (err) {
  console.log("  ✗ TypeScript build failed");
  console.log(`    → ${err.stderr?.toString().slice(0, 500)}`);
  failed++;
}

try {
  console.log("  Running all test suites...");
  const testOutput = execSync("npm.cmd test", {
    cwd: path.join(root, "services", "api"),
    stdio: "pipe",
    env: { ...process.env, NODE_ENV: "test" },
  });
  const outputStr = testOutput.toString();
  console.log("  ✓ All backend tests passed");
  passed++;

  // Extract pass count if available
  const passMatch = outputStr.match(/(\d+)\s+pass/i);
  if (passMatch) {
    console.log(`    → ${passMatch[1]} tests passed`);
  }
} catch (err) {
  const output = err.stdout?.toString() || err.stderr?.toString() || "";
  console.log("  ✗ Backend tests failed");
  console.log(`    → ${output.slice(-500)}`);
  failed++;
}

// ── Summary ──────────────────────────────────────────────────────────
console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══`);
process.exit(failed > 0 ? 1 : 0);
