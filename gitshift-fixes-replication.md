# GitShift Manager — Patch Replication Guide

Hand this file to Claude Code on another device (desktop / other laptop) to apply the
**exact same fixes** that were made to the **GitShift Manager** Cursor extension
(`mikeeeyy04.gitshift`, v1.0.0).

> **Claude Code: read this whole file first, then apply Steps 1–5 in order.**
> The extension ships only compiled JavaScript (no TypeScript source), so we edit the
> `.js` files in place. After editing, the user MUST **Reload Window** in Cursor for
> changes to take effect.

---

## Background (why these changes)

Everything in GitShift derives the "active account" from `git config user.name` + `user.email`,
matched against `.vscode/github-accounts.json`. Five problems were fixed:

1. **Initialize Repository did nothing** — `git init` was wrapped in a guard that aborts when
   not already in a repo (always true when initializing).
2. **Selecting an account silently failed in a non-repo folder** — `git config user.name`
   (local scope) fails when there's no repo.
3. **`git init` defaulted to `master`** — GitHub prefers `main`.
4. **No way to publish an already-initialized local repo** — the Publish button only showed
   when *not* in a repo, so clicking Initialize stranded the repo with no remote.
5. (Optional, per-device) Global git identity + default branch.

---

## Step 0 — Locate the extension

The extension lives under the Cursor extensions folder. The version suffix may differ.

- **Windows:** `C:\Users\<you>\.cursor\extensions\mikeeeyy04.gitshift-<version>\out\`
- **macOS/Linux:** `~/.cursor/extensions/mikeeeyy04.gitshift-<version>/out/`

Find the exact folder (Windows PowerShell example):
```powershell
Get-ChildItem "$env:USERPROFILE\.cursor\extensions" -Directory -Filter "mikeeeyy04.gitshift*"
```

All edits below are inside that `out/` folder. **Before each edit, confirm the OLD block
still matches exactly** (versions may differ slightly). If an OLD block isn't found,
stop and report — do not guess.

---

## Step 1 — `out/extension.js` : make Initialize Repository actually run

The init command wraps `git init` in `handleGitOperation()`, which bails out with
"Not in a Git repository". Unwrap it.

**FIND:**
```js
            gitshiftOutputChannel?.appendLine('[initRepo] User confirmed, proceeding...');
            await handleGitOperation('initialize repository', async () => {
                gitshiftOutputChannel?.appendLine('[initRepo] Starting repository initialization...');
                const { initRepository } = await Promise.resolve().then(() => __importStar(require('./gitOperations')));
                await initRepository();
                gitshiftOutputChannel?.appendLine('[initRepo] Repository initialized successfully');
                vscode.window.showInformationMessage('Repository initialized');
                if (repositoryProvider)
                    await repositoryProvider.refresh();
                // Add small delay to ensure Git repository is detected
                setTimeout(async () => {
                    if (sidebarProvider)
                        await sidebarProvider.refresh(true);
                }, 200);
            });
```

**REPLACE WITH:**
```js
            gitshiftOutputChannel?.appendLine('[initRepo] User confirmed, proceeding...');
            // NOTE: do NOT wrap this in handleGitOperation() — that helper aborts with
            // "Not in a Git repository" when the workspace isn't already a repo, which is
            // always the case when initializing. Run the init directly instead.
            gitshiftOutputChannel?.appendLine('[initRepo] Starting repository initialization...');
            const { initRepository } = await Promise.resolve().then(() => __importStar(require('./gitOperations')));
            await initRepository();
            gitshiftOutputChannel?.appendLine('[initRepo] Repository initialized successfully');
            vscode.window.showInformationMessage('Repository initialized');
            if (repositoryProvider)
                await repositoryProvider.refresh();
            // Add small delay to ensure Git repository is detected
            setTimeout(async () => {
                if (sidebarProvider)
                    await sidebarProvider.refresh(true);
            }, 200);
```

---

## Step 2 — `out/gitManager.js` : let account-switch work before a repo exists

`setGitUser` writes local git config, which fails with no repo. Fall back to `--global`.

**FIND:**
```js
async function setGitUser(name, email) {
    try {
        await executeGitCommand(`git config user.name "${name}"`);
        await executeGitCommand(`git config user.email "${email}"`);
    }
    catch (error) {
        throw new Error(`Failed to set git user: ${error.message}`);
    }
}
```

**REPLACE WITH:**
```js
async function setGitUser(name, email) {
    try {
        // When the workspace isn't a Git repo yet there is no local config to write to,
        // so `git config user.name` fails. Fall back to the global identity in that case
        // so an account can be selected/activated BEFORE running `git init`. Once a repo
        // exists we write the repo-local config so per-repo identities still work.
        const scope = (await isGitRepository()) ? '--local' : '--global';
        await executeGitCommand(`git config ${scope} user.name "${name}"`);
        await executeGitCommand(`git config ${scope} user.email "${email}"`);
    }
    catch (error) {
        throw new Error(`Failed to set git user: ${error.message}`);
    }
}
```

> Note: `isGitRepository` is defined in the same file, so it's directly callable here.

---

## Step 3 — `out/gitOperations.js` : default new repos to `main`

**FIND:**
```js
async function initRepository() {
    await executeGitCommand('init');
}
```

**REPLACE WITH:**
```js
async function initRepository() {
    // Default the initial branch to "main" (GitHub's default) instead of git's
    // built-in "master". `-b` requires Git >= 2.28; fall back to `init` + rename
    // on older gits so initialization never hard-fails.
    try {
        await executeGitCommand('init -b main');
    }
    catch (error) {
        await executeGitCommand('init');
        try {
            await executeGitCommand('branch -m main');
        }
        catch {
            // No commits yet on very old gits — set the default for the next checkout.
            await executeGitCommand('symbolic-ref HEAD refs/heads/main');
        }
    }
}
```

---

## Step 4 — `out/sidebarWebview.js` : show "Publish to GitHub" for a repo with no remote

Two edits in the `_getHtmlContent()` method.

### 4a — fetch the remote URL

**FIND:**
```js
        let accounts = [];
        let currentUser = null;
        let currentAccount = null;
        let isGitRepo = false;
        try {
            isGitRepo = await (0, gitManager_1.isGitRepository)();
            await (0, accountManager_1.accountsFileExists)(); // Check if config exists but don't store result
            accounts = await (0, accountManager_1.loadAccounts)();
            currentUser = await (0, gitManager_1.getCurrentGitUser)();
```

**REPLACE WITH:**
```js
        let accounts = [];
        let currentUser = null;
        let currentAccount = null;
        let isGitRepo = false;
        let remoteUrl = null;
        try {
            isGitRepo = await (0, gitManager_1.isGitRepository)();
            await (0, accountManager_1.accountsFileExists)(); // Check if config exists but don't store result
            accounts = await (0, accountManager_1.loadAccounts)();
            currentUser = await (0, gitManager_1.getCurrentGitUser)();
            // A repo with no remote can still be published to GitHub, so surface the
            // Publish button in that state (the 3-button no-repo block is hidden once
            // the folder is a repo).
            if (isGitRepo) {
                remoteUrl = await (0, gitManager_1.getGitRemoteUrl)();
            }
```

### 4b — render the Publish banner

**FIND:**
```js
  ${isGitRepo && currentUser ? `
    <div class="current-account">
      <div class="current-label">Current Identity</div>
```

**REPLACE WITH:**
```js
  ${isGitRepo && !remoteUrl ? `
    <div class="no-repo-container" style="padding-bottom: 4px;">
      <div class="no-repo-content">
        <p style="font-size: clamp(11px, 2.8vw, 12px); color: var(--vscode-descriptionForeground); margin-bottom: 12px; line-height: 1.5;">
          This repository isn't on GitHub yet. Publish it to create the GitHub repo and push your code.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
          <button class="btn btn-primary cursor-pointer" onclick="publishToGitHub()" title="Create a GitHub repository for this folder and push to it">
            <i class="codicon codicon-github" style="font-size: 14px;"></i> Publish to GitHub
          </button>
        </div>
      </div>
    </div>
  ` : ''}

  ${isGitRepo && currentUser ? `
    <div class="current-account">
      <div class="current-label">Current Identity</div>
```

> `getGitRemoteUrl` is already exported by `gitManager.js`, and the `publishToGitHub()`
> JS function already exists in this webview, so no other wiring is needed.

---

## Step 5 — Verify, then reload

### Syntax-check every edited file (from the `out/` folder):
```bash
node --check extension.js
node --check gitManager.js
node --check gitOperations.js
node --check sidebarWebview.js
```
All four should print nothing / exit 0. (On Windows PowerShell, run them one per line.)

### Reload Cursor
`Ctrl/Cmd + Shift + P` → **Developer: Reload Window**. The extension runs compiled JS
loaded into memory, so edits don't apply until the window reloads.

### Smoke test
1. Open a fresh empty folder.
2. Click an account in GitShift → it gets the **Active** badge (no silent failure).
3. Click **Initialize Repository** → confirm modal → repo is created on branch `main`
   (`git branch --show-current` → `main`).
4. A **Publish to GitHub** banner appears (repo has no remote). Clicking it creates the
   GitHub repo + commits + pushes.

---

## Step 6 (OPTIONAL, per-device) — global git identity & default branch

These are personal machine settings, NOT part of the extension. Set them to match the
laptop. **Adjust name/email to your account** (these were the values used on the laptop):

```bash
git config --global user.name "Bailey Killian"
git config --global user.email "bailey.killian@gmail.com"
git config --global init.defaultBranch main
```

`init.defaultBranch main` makes EVERY `git init` on the machine (terminal or any tool)
default to `main`, not just GitShift.

---

## Summary of files changed

| File (`out/`)        | Change                                                        |
|----------------------|---------------------------------------------------------------|
| `extension.js`       | Unwrap Initialize from `handleGitOperation` guard             |
| `gitManager.js`      | `setGitUser` falls back to `--global` when no repo            |
| `gitOperations.js`   | `initRepository` uses `git init -b main`                       |
| `sidebarWebview.js`  | Publish button shows for an initialized repo with no remote    |

**Workflow reminder:** *Publish to GitHub* is all-in-one (init + create-on-GitHub + commit
+ push) — use it instead of Initialize for a new GitHub project. *Initialize Repository* is
local-only.
