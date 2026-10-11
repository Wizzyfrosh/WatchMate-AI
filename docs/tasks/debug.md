# Antigravity task — diagnose one observed failure

Use this with the exact failing command, first meaningful error and reproduction steps. Exclude credentials from pasted logs.

Read AGENTS.md, docs/toolchain.md and the affected source/configuration. Inspect the current diff. Form a testable hypothesis using the error and official documentation for uncertain behavior. Reproduce the smallest failure, fix the root cause and rerun the affected check. Revise an unsuccessful hypothesis using new evidence.

Preserve lockfiles, user changes, strict validation and access controls. Do not re-scaffold the app, force installs, disable tests or grant broad cloud permissions to hide the problem. Avoid unrelated upgrades or repeated full audits.

Record the command, machine, actual result and remaining uncertainty in docs/progress.md. Return the cause, changed files, verification result and next action. Mark native or live-model checks pending when unavailable.
