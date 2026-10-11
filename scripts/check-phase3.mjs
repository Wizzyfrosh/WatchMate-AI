import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function run(command, args, cwd, label) {
  console.log('\n========================================');
  console.log(`[Phase 3 Check] ${label}`);
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

console.log('Starting WatchMate AI Phase 3 (G3) Verification Suite...\n');

// 1. Backend Build & Bedrock / Assist Integration Tests
run('npm.cmd', ['run', 'build'], path.join(rootDir, 'services', 'api'), 'Backend TypeScript Compilation');
run('npm.cmd', ['test'], path.join(rootDir, 'services', 'api'), 'Backend & Bedrock Unit/Integration Tests');

// 2. Contracts Package Tests (Evidence selection, source resolution)
run('npm.cmd', ['test'], path.join(rootDir, 'packages', 'contracts'), 'Contracts Package Unit Tests');

// 3. Educational Content Integrity
run('node', ['content/validate.mjs'], rootDir, 'Content Package Integrity');

// 4. TV App Unit Tests (apiClient, sessionStore, playback, captions)
run('npm.cmd', ['test'], path.join(rootDir, 'apps', 'tv'), 'TV App Unit Tests');

// 5. TV App Typecheck
run('npm.cmd', ['run', 'typecheck'], path.join(rootDir, 'apps', 'tv'), 'TV App TypeScript Compilation');

// 6. TV App Metro Bundle Check
run('npm.cmd', ['run', 'bundle:android', '--', '--max-workers', '2'], path.join(rootDir, 'apps', 'tv'), 'TV App Metro Android JS Bundle');

console.log('\n========================================');
console.log('ALL PHASE 3 (G3) CHECKS PASSED SUCCESSFULLY!');
console.log('========================================\n');
