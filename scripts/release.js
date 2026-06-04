#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const pkg = require('../package.json');
const version = pkg.version;
const tag = `v${version}`;

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function runSilent(cmd) {
  return execSync(cmd, { stdio: 'pipe' }).toString().trim();
}

console.log(`\nReleasing GitShift Redux ${tag}...\n`);

// 1. Compile + package
run('npm run package');

// 2. Install locally in Cursor
const vsix = `gitshift-redux-${version}.vsix`;
try {
  run(`cursor --install-extension ${vsix}`);
} catch {
  console.warn('  (Cursor not in PATH — skipping local install, continuing)\n');
}

// 3. Stage everything
run('git add -A');

// 4. Commit if there are staged changes
const staged = runSilent('git diff --cached --name-only');
if (staged.length > 0) {
  run(`git commit -m "chore: release ${tag}"`);
} else {
  console.log('  Nothing to commit.\n');
}

// 5. Tag (skip if already exists)
let tagExists = false;
try {
  runSilent(`git rev-parse ${tag}`);
  tagExists = true;
} catch { /* tag doesn't exist yet */ }

if (tagExists) {
  console.log(`  Tag ${tag} already exists, skipping.\n`);
} else {
  run(`git tag -a ${tag} -m "Release ${tag}"`);
}

// 6. Push branch + tags
try {
  run('git push');
  run('git push --tags');
  console.log(`\nDone. GitHub Actions will build the release at:\nhttps://github.com/incompletebiped/gitshift-redux/releases/tag/${tag}\n`);
} catch (e) {
  const msg = e.message || '';
  if (msg.includes('workflow')) {
    console.error(`
Push blocked: your stored token is missing the "workflow" scope.
GitHub requires it to push files under .github/workflows/.

Fix:
  1. In GitShift, update the incompletebiped token to a PAT that includes
     repo, user:email, read:user, workflow scopes.
  2. Then run:  git push && git push --tags

The commit and tag ${tag} are already created locally.
`);
  } else {
    console.error(`\nPush failed: ${msg}\n`);
  }
  process.exit(1);
}
