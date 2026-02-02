# VaultDeck Agent Guide

## Purpose

This file provides quick, reliable context for AI agents and contributors working on this repo. It highlights the project structure, safe defaults, and security boundaries.

## Project Overview

- Minimal, offline-first vault for payment card details
- PIN + biometric unlock, encrypted local storage, encrypted backups
- Expo/React Native app with TypeScript
- Supports iOS, Android, and web (web has limited functionality)

## Key Directories

- `app/` - Expo Router screens and layouts
- `src/state/` - Zustand stores (auth, vault, settings, theme)
- `src/storage/` - Secure storage and vault persistence
- `src/crypto/` - Encryption and backup crypto helpers
- `src/components/` - Reusable UI components
- `src/features/` - Feature-specific UI and logic (e.g., settings sections)
- `src/utils/` - Shared utilities (haptics, logging, responsive UI, theme, etc.)
- `src/types/` - Centralized TypeScript definitions
- `__tests__/` - Jest tests (logic should maintain high coverage)
- `.github/workflows/` - CI workflows (lint, typecheck, test, audit)

## Safe Defaults

- Prefer small, targeted changes with tests updated as needed
- Follow existing patterns and naming conventions
- Keep UI consistent with the current design system and styles
- Use `responsiveFontSize`, `responsiveSpacing`, and `Theme` tokens for all UI changes
- All logic changes (crypto, storage, state, utils) should maintain high test coverage
- Keep `package.json` version and `app.json` version in sync
- **Update AGENTS.md when changing configuration**: If you modify `package.json`, `app.json`, CI workflows, or testing infrastructure, check if AGENTS.md needs corresponding updates to stay synchronized

## Security Boundaries (Do Not Weaken)

- Do not log sensitive data (PINs, card numbers, keys, backups)
- Do not reduce cryptographic strength or change algorithms without a clear migration plan
- Do not bypass biometric/PIN checks or auto-lock behavior
- Avoid exposing secrets in logs, UI, or analytics
- PINs must remain 4-8 digits and be stored only as salt + SHA-256 hash; failed attempts lock out after 5 tries for 60 seconds
- Keep vault encryption as NaCl secretbox (xsalsa20-poly1305, 32-byte key, 24-byte nonce) with payload version 1
- Vault key stays in SecureStore (or in-memory only for web fallback); never persist it in plaintext files
- Do not bypass backup passphrase requirements or import warnings; imports overwrite all vault data
- Platform differences must be handled explicitly (Android, iOS, Web)
- Web fallback must never silently weaken security guarantees
- Clipboard auto-clear is a security feature; respect `clipboardTimeoutSeconds` from settings

## Web Platform Limitations

- Backup export is not supported (throws `ExportNotSupportedError`)
- Vault key stored in-memory only (no SecureStore equivalent); data is lost on refresh
- Haptic feedback is disabled
- File system operations use in-memory fallback (no persistence across sessions)

## Absolute Prohibitions

- Never add analytics, crash reporting, ads, or telemetry of any kind
- Never add network requests unless explicitly requested and reviewed
- Never store or handle CVV, OTPs, or bank passwords
- Never introduce proprietary or non-free SDKs

## Logging Rules

- Use `logger` for diagnostics; it is dev-only (`__DEV__`) and must never log sensitive vault fields (PINs, card numbers, vault key, backup payloads)

## Commands

- `npm install` - Install dependencies
- `npx expo start` - Start dev server
- `npm run test` - Run Jest tests
- `npm run check` - Run lint, typecheck, tests, audit

## CI Pipeline

Quality checks run automatically on PRs and pushes to main via GitHub Actions:

1. ESLint (`npm run lint`)
2. TypeScript typecheck (`npm run typecheck`)
3. Jest tests with coverage (`npm test -- --coverage`)
4. Security audit (`npm audit --omit=dev --audit-level=high`)

## Testing Guidance

- Update/add tests in `__tests__/` when changing storage, crypto, or auth flows
- Update/add tests in `__tests__/` when changing backup behavior, PIN resiliency, or secure store behavior
- Run `npm run test` for logic changes; `npm run check` for broader changes
- Coverage thresholds in `package.json`: 95% branches, 99% lines/statements, 100% functions
- Uncovered code consists of defensive error handlers (timeout conditions, storage failures in nested try-catch blocks)
- Aim to maintain or improve these thresholds; avoid adding untested code paths

## Backup Format Notes

- Backup files are `.vdb` (primary) and encrypted with passphrase
- Import also accepts legacy `.blob` files
- Backup envelope must match: `magic: "VAULTDECK_BACKUP"`, `version: 4`, `kdf: "pbkdf2-sha256"`, base64 `salt`, and `iterations` within 60k-180k
- Backup payload decrypts to `{ version: 1, key, blob }`; `version` must stay stable or be migrated explicitly
- Changes to backup format should be versioned and backward-compatible
- PBKDF2 iterations vary by platform for performance: Android <29 uses 60k, Android ≥29 uses 100k, iOS uses 120k

## Cryptographic Dependencies

- `tweetnacl` - NaCl secretbox encryption (xsalsa20-poly1305)
- `tweetnacl-util` - Base64/UTF8 encoding utilities
- `@stablelib/pbkdf2` - Key derivation for backup passphrases
- `@stablelib/sha256` - SHA-256 for PBKDF2 and PIN hashing
- `expo-crypto` - Random bytes generation and digest

## Data Model & Sensitive Fields

Card type fields:

- `id` - Unique identifier
- `nickname` - User-defined card name
- `issuer` - Card issuer/bank
- `cardholderName` - **Sensitive** - Cardholder's name
- `cardNumber` - **Sensitive** - Full card number (optional, masked in UI)
- `last4` - **Sensitive** - Last 4 digits of card
- `expiryMonth` - **Sensitive** - Expiry month
- `expiryYear` - **Sensitive** - Expiry year
- `notes` - **Sensitive** - User notes
- `tags` - Array of tag strings
- `favorite` - Boolean for favorites feature
- `createdAt` - ISO timestamp
- `updatedAt` - ISO timestamp

Vault data includes `tagColors` map for per-tag color customization.

Cards are sorted by: (1) favorites first, (2) alphabetically by nickname.

## Theme & Customization

- Theme preference: `system`, `light`, or `dark` (stored in themeStore)
- Accent colors: `amber` (default), `blue`, `green`, `violet`, `rose`, `teal`
- Use `Theme` tokens for colors, spacing, radius, and fonts
- Haptics are Android-only and can be toggled in settings

## Settings & Auth Store Features

**Settings Store** (`settingsStore.ts`):

- `hapticsEnabled` - Toggle haptic feedback (Android only)
- `clipboardTimeoutSeconds` - Auto-clear clipboard duration (default: 10s)

**Auth Store** (`authStore.ts`):

- `autoLockSeconds` - Auto-lock timeout (0 = instant, or 30s, 60s, 300s)
- `biometricEnabled` - Toggle biometric unlock (requires PIN first)
- `pinLength` - Stored PIN length for UI hints (4-8 digits)

## When in Doubt

- Ask for clarification on any data-handling or security-sensitive change
- Keep changes minimal and reversible
- Check if documentation (AGENTS.md, README.md) needs updates when changing behavior or configuration

## Release Discipline

- Bump versionCode/versionName intentionally
- Never reuse versionCode
- Keep release notes accurate and minimal
- Sync version in both `package.json` and `app.json`
