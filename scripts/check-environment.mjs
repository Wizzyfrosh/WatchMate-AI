import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const windows = process.platform === 'win32';
let missing = false;
console.log('WatchMate Phase 0: read-only environment check');
console.log(`Platform: ${process.platform}; Node: ${process.version}`);
const [major, minor, patch] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && (minor < 19 || (minor === 19 && patch < 4)))) {
  console.log('FAIL: this candidate toolchain needs Node >=20.19.4.');
  missing = true;
}
function check(label, command, args) {
  const result = spawnSync(command, args, {encoding: 'utf8', timeout: 15000});
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  console.log(`\n${label}: ${result.status === 0 ? 'FOUND' : 'MISSING / FAILED'}`);
  if (text) console.log(text.split('\n').slice(0, 5).join('\n'));
  if (result.error) console.log(result.error.code ?? result.error.message);
  if (result.status !== 0) missing = true;
}
check('Java on PATH', 'java', ['-version']);
check('Git', 'git', ['--version']);
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  (windows && process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : '');
if (!sdk || !existsSync(sdk)) {
  console.log('\nAndroid SDK: not found. Check the SDK location in Android Studio.');
  missing = true;
} else {
  console.log(`\nAndroid SDK: ${sdk}`);
  check('ADB devices', join(sdk, 'platform-tools', windows ? 'adb.exe' : 'adb'), ['devices']);
  check('Available emulator profiles', join(sdk, 'emulator', windows ? 'emulator.exe' : 'emulator'), ['-list-avds']);
  for (const item of ['platforms/android-36', 'build-tools/36.0.0', 'ndk/27.1.12297006']) {
    const found = existsSync(join(sdk, item));
    console.log(`${item}: ${found ? 'FOUND' : 'MISSING'}`);
    if (!found) missing = true;
  }
}
console.log('\nThis checks availability only; it does not prove JDK compatibility or emulator playback.');
console.log(missing ? 'Resolve the missing tools before the native build.' : 'Tools found. Next: boot an Android TV AVD and follow README.md.');
process.exitCode = missing ? 1 : 0;
