import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function run(command, args, cwd, label) {
  console.log('\n========================================');
  console.log(`[Phase 4 Check] ${label}`);
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

console.log('Starting WatchMate AI Phase 4 (G4) Verification Suite...\n');

// 1. Content Package Validation (all 3 educational lessons)
run('node', ['content/validate.mjs'], rootDir, 'Content Package Validation (3 Lessons)');

// 2. Contracts Package Tests
run('npm.cmd', ['test'], path.join(rootDir, 'packages', 'contracts'), 'Contracts Package Unit Tests');

// 3. Backend Build & 52 Unit/Integration/Evaluation Tests (including 20-case eval suite)
run('npm.cmd', ['run', 'build'], path.join(rootDir, 'services', 'api'), 'Backend TypeScript Compilation');
run('npm.cmd', ['test'], path.join(rootDir, 'services', 'api'), 'Backend Suite & 20-Case Evaluation Set');

// 4. TV App Unit Tests (20 tests in apiClient, sessionStore, playback, captions)
run('npm.cmd', ['test'], path.join(rootDir, 'apps', 'tv'), 'TV App Unit Tests');

// 5. TV App TypeScript Compilation
run('npm.cmd', ['run', 'typecheck'], path.join(rootDir, 'apps', 'tv'), 'TV App TypeScript Compilation');

// 6. TV App Metro Android Bundle Check
run('npm.cmd', ['run', 'bundle:android', '--', '--max-workers', '2'], path.join(rootDir, 'apps', 'tv'), 'TV App Metro Android JS Bundle');

console.log('\n========================================');
console.log('ALL PHASE 4 (G4) CHECKS PASSED SUCCESSFULLY!');
console.log('========================================\n');
