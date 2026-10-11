import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function run(command, args, cwd, label) {
  console.log('\n========================================');
  console.log(`[Phase 2 Check] ${label}`);
  console.log(`CWD: ${cwd}`);
  console.log(`Command: ${command} ${args.join(' ')}`);
  console.log('========================================');

  const res = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  if (res.status !== 0) {
    console.error(`FAILED: ${label} (exit code ${res.status})`);
    process.exit(res.status || 1);
  }
  console.log(`PASSED: ${label}`);
}

console.log('Starting WatchMate AI Phase 2 (G2) Verification Suite...\n');

// 1. TV App Unit Tests
run('npm.cmd', ['test'], path.join(rootDir, 'apps', 'tv'), 'TV App Unit Tests (sessionStore, playback, captions)');

// 2. TV App Typecheck
run('npm.cmd', ['run', 'typecheck'], path.join(rootDir, 'apps', 'tv'), 'TV App TypeScript Compilation');

// 3. TV App Bundle
run('npm.cmd', ['run', 'bundle:android', '--', '--max-workers', '2'], path.join(rootDir, 'apps', 'tv'), 'TV App Metro Android JS Bundle');

// 4. Contracts Suite Regression
run('npm.cmd', ['test'], path.join(rootDir, 'packages', 'contracts'), 'Contracts Package Unit Tests');

// 5. Educational Content Package Integrity
run('node', ['content/validate.mjs'], rootDir, 'Content Package Integrity');

// 6. API Backend Integration Tests
run('npm.cmd', ['test'], path.join(rootDir, 'services', 'api'), 'API Backend Integration Tests');

console.log('\n========================================');
console.log('ALL PHASE 2 (G2) CHECKS PASSED SUCCESSFULLY!');
console.log('========================================\n');
