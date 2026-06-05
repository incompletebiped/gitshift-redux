# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Mission & Development Rules

**The point of this extension**: let users manage multiple GitHub accounts, switch between them with one click, and perform all standard git operations (initialize, publish, clone, pull, stage, commit, push) — all without triggering Cursor AI's built-in GitHub auth popup, and with full credential security.

### Non-negotiable rules for every change

1. **Never break primary functions.** The following must always work after any change: account sign-in (PAT + OAuth), account switching, initialize repo, publish to GitHub, clone, pull, stage files, commit, push. If a change breaks any of these, revert it.

2. **Do not replace working approaches.** If a mechanism already works (e.g., how credentials are configured, how remote URLs are rewritten, how git config is set), improve it only to fix a specific gap — do not swap it for an alternative approach "to be cleaner." The original GitShift patterns that work must be preserved unless there is a concrete bug to fix.

3. **No Cursor auth popup.** Authentication must flow through PAT tokens stored in VS Code Secret Storage, or through `vscode.authentication.getSession` — never in a way that triggers Cursor's built-in GitHub sign-in dialog.

4. **Improvements fix gaps, not primary flows.** New work should add missing behavior or patch bugs. It must not reorganize, refactor, or reimagine how core account switching and git operations work unless those are themselves the broken thing.

5. **Before changing any of these files, read the existing logic first**: `extension.ts` (`handleSwitchToAccount`, `autoActivateFirstAccount`), `gitCredentials.ts`, `githubAuth.ts`. These are the most critical and the most likely to be accidentally broken.

## Project Overview

GitShift Redux is a VS Code extension (sideloaded, not on the Marketplace) that lets users switch between multiple GitHub accounts within a single editor session — handling git config identity, credential storage, and remote URL rewriting per-account. It is a fork of the upstream GitShift Manager that adds fixes for three bugs specific to Cursor AI and VS Code forks:

1. **Credential conflicts** — upstream overwrites Windows Credential Manager; fixed via `credential.useHttpPath=true`
2. **Git missing from PATH** — extension-host PATH lacks Git in Cursor; fixed via `ensureGitOnPath()` in `extension.ts`
3. **Init deadlock** — upstream blocks account selection until a repo exists; fixed to fall back to global git config

## Commands

```bash
npm run compile     # TypeScript → out/ (one-shot)
npm run watch       # Continuous compilation during development
npm run lint        # ESLint check
npm run package     # Build distributable .vsix
npm run clean       # Remove out/
```

**Development cycle**: Press **F5** in VS Code/Cursor after `npm run compile` to launch a test Extension Development Host window. There are no automated tests — validation is manual via the debug host.

To install a build locally: `Extensions panel → ··· → Install from VSIX...`

## Architecture

The extension has no bundler — TypeScript compiles directly to CommonJS in `out/` via `tsc`. VS Code loads `out/extension.js` at startup.

### Module Responsibilities

| File | Responsibility |
|------|---------------|
| `extension.ts` | Entry point (~3100 lines): registers all 40+ commands, initializes all subsystems, implements account-switching logic, PATH repair, auto-import, auto-activate |
| `types.ts` | `GitHubAccount` and `GitUser` interfaces |
| `gitManager.ts` | Raw git command execution via `child_process.exec` with `GIT_TERMINAL_PROMPT=0` |
| `gitOperations.ts` | High-level git workflows: branch, stash, commit, push, pull, init, clone |
| `gitCredentials.ts` | Credential helper config (`credential.useHttpPath`, `credential.helper=store`), remote URL rewriting with embedded token, GitHub URL parsing |
| `accountManager.ts` | Load/save `.vscode/github-accounts.json`; auto-adds it to `.gitignore` |
| `githubAuth.ts` | VS Code `authentication.getSession` OAuth flow, PAT token storage in `globalState.secrets`, GitHub REST API calls (user info, repo access, create repo) |
| `sidebarWebview.ts` | Activity Bar panel — account list, sign-in buttons, active account indicator |
| `repositoryWebview.ts` | Repository panel — staged/unstaged changes, branches (ahead/behind), recent commits, `.git/` file watcher |
| `statusBar.ts` | Status bar item showing current git identity; click to switch accounts |
| `contributionsWebview.ts` | GitHub contributions calendar heatmap fetched from GitHub Events API |
| `supportWebview.ts` | Help/support panel |
| `repoQuickClone.ts` | Clone + auto-switch account in one flow |

Scaffolded but not wired (targeted for v1.3): `githubNotifications.ts`, `commitMessageGenerator.ts`, `commitDetailsWebview.ts`, `settingsWebview.ts`.

### Key Data Flows

**Account switching** (`handleSwitchToAccount` in `extension.ts`):
1. Retrieve token from `globalState.secrets` or VS Code session
2. If GitHub remote exists: verify account has repo access via GitHub API
3. `git config [--local|--global] user.{name,email}`
4. `gitCredentials.configureGitCredentials` — sets `useHttpPath=true`, `credential.helper=store`, HTTPS extraheader
5. Rewrite remote URL to `https://<token>@github.com/owner/repo`
6. Refresh status bar, sidebar, contributions view

**Sign-in flow**:
1. `vscode.authentication.getSession('github', scopes)` → OAuth browser popup
2. Fetch username/email from GitHub API
3. Store token in `globalState.secrets['github-token-<username>']`
4. Upsert account in `github-accounts.json`
5. Auto-activate if no active account

**Startup auto-activation**:
1. Import all VS Code GitHub sessions + all stored PAT tokens
2. If in a git repo with a GitHub remote: find account with access to that repo
3. Fall back to first authenticated account
4. Fall back to global git config (no error if no repo exists yet)

### Account Storage

Accounts persist in two places:
- **`.vscode/github-accounts.json`** — display names, emails, usernames, avatars (no tokens)
- **VS Code Secret Storage** (`globalState.secrets`) — tokens keyed as `github-token-<username>`

The accounts file is always gitignored. Tokens are never written to disk directly.

## TypeScript Config

- **Target**: ES2020, **Module**: CommonJS, **Output**: `out/`, **Strict**: true
- Source maps enabled; no `noEmitOnError` so partial builds are possible during development

## Extension Manifest Highlights

- **Activation**: `onStartupFinished`
- **Views**: 4 webview panels in the Activity Bar sidebar (`githubAccountsWebview`, `repositoryWebview`, `contributionsWebview`, `supportWebview`)
- **Keybindings**: `Ctrl+Shift+1`–`5` (Mac: `Cmd+Shift+1`–`5`) to switch accounts 1–5
- **Settings**: `gitshift.repositoryAssociations` (map workspace paths → account labels), `gitshift.autoSwitchAccounts`
