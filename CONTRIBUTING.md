# Contributing to VaultDeck

Thank you for helping improve VaultDeck.

## Getting started

1. Fork the repository and create a branch from `main`.
2. Install dependencies: `npm install`
3. Run quality checks before opening a PR: `npm run check`

## Guidelines

- Keep changes focused and small; match existing code style.
- For crypto, storage, auth, or backup work, add or update tests in `__tests__/`.
- Read [AGENTS.md](AGENTS.md) for project structure and **security boundaries** (required for human and AI contributors).
- Read [SECURITY.md](SECURITY.md) before reporting or fixing security issues.

## Pull requests

Use the PR template checklist. Do not weaken PIN lockout, auto-lock, encryption, or clipboard security without discussion.

## Versioning and releases

Follow the release audit process in [AGENTS.md](AGENTS.md) before bumping `package.json` / `app.json` versions.
