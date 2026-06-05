# GitShift Redux — Roadmap

> Items are loosely ordered by priority. Checked items are shipped.

---

## v1.2 — Error Handling & Clarity

The current error surface dumps raw git output into a single dialog with no context. The goal of this milestone is to make every failure self-explanatory and actionable.

- [ ] **Error parser** — Intercept raw git stderr and map known patterns to friendly messages with a suggested fix. Start with the most common failures:
  - `unable to append to '.git/logs/...'` → "Windows atomic write conflict — run `git config windows.appendAtomically false`" (with a **Fix Now** button that runs it)
  - `Authentication failed` → "Wrong credentials for this account — try re-authenticating in GitShift Manager"
  - `remote: Repository not found` → "This remote doesn't exist or your account doesn't have access"
  - `rejected (non-fast-forward)` → "Remote has commits you don't have locally — pull first, then push"
  - `nothing to commit` → "No changes staged — stage files before committing"
  - `not a git repository` → "This folder isn't a git repo — use Initialize Repository"
  - `no upstream branch` → "Branch has no remote tracking branch — set one with Push (set upstream)"
  - `merge conflict` → "Merge conflict detected — resolve conflicts in the editor then commit"
  - `index.lock` exists → "Another git process is running — delete `.git/index.lock` if you're sure nothing else is running" (with **Delete Lock** button)
- [ ] **Error severity levels** — Distinguish between warnings (yellow), recoverable errors (orange), and fatal errors (red) rather than always showing a red ✕
- [ ] **Persistent error log** — Output channel `GitShift Logs` so the raw git output is still accessible for debugging without cluttering the UI
- [ ] **Inline repo errors** — Show errors in the Repository webview next to the action that triggered them, not just as a floating VS Code notification
- [ ] **Network error detection** — Detect offline/DNS failure and show "No network connection" rather than a raw curl/SSL stack trace

---

## v1.3 — Incomplete Features

Features that exist in the codebase but were never finished.

- [ ] **GitHub Notifications panel** — `githubNotifications.ts` is scaffolded but not wired up. Show unread notifications from all configured accounts in one view
- [ ] **Commit message generator** — `commitMessageGenerator.ts` is stubbed. Use the staged diff to suggest a conventional-commit message (can be AI-assisted or rule-based)
- [ ] **Commit details view** — `commitDetailsWebview.ts` is minimal. Show full diff, file tree, author, and parent commits when clicking a commit in the log

---

## v1.4 — Account & Auth Quality of Life

- [ ] **Token expiry warnings** — Proactively detect when a PAT is close to expiring (via GitHub API `rate_limit` headers or token metadata) and prompt to rotate it
- [ ] **Account health check** — A "Test Connection" button per account that validates the token, checks repo access, and reports which scopes are missing
- [ ] **Better PAT scope guidance** — When adding an account via PAT, show exactly which scopes are required and link to GitHub's token creation page pre-filled with them
- [ ] **SSH key support** — Allow accounts to authenticate via SSH keys in addition to HTTPS/PAT
- [ ] **Multiple accounts same org** — Handle the edge case of two accounts in the same GitHub org (e.g. personal + bot) without credential collisions

---

## v1.5 — Repository & Git UX

- [ ] **Conflict resolution helper** — When a merge/rebase conflict is detected, show conflicted files in the Repository view with one-click "Open in diff editor"
- [ ] **Stash naming** — Prompt for a stash description when stashing, and show that description in the stash list
- [ ] **Branch comparison** — Show ahead/behind counts for all branches relative to their upstream (currently only shown for the active branch)
- [ ] **Bulk file staging** — Checkbox selection in the Changes tab to stage/unstage multiple files at once without right-clicking each one
- [ ] **Revert commit** — Add a Revert option in the commit log context menu (creates a new revert commit rather than destructive reset)

---

## v1.6 — Distribution & Packaging

- [ ] **Auto-update** — Package as an Open VSIX or private marketplace entry so users get updates without manually sideloading `.vsix` files
- [ ] **Windows installer** — A simple `.exe` wrapper that installs the extension and sets `windows.appendAtomically false` globally on first run
- [ ] **VSIX release automation** — GitHub Action that builds and attaches a `.vsix` to every tagged release

---

## Backlog (no milestone yet)

- Dark/light theme parity in all webviews — some panels still hard-code colors
- Contributions graph date range picker (currently fixed to the last year)
- Quick clone from the sidebar without leaving the editor
- Multi-root workspace support (currently assumes a single git repo per workspace)
- Upstream diff — compare this fork's patches against upstream GitShift to keep the fork maintainable
