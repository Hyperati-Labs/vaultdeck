# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.7+  | :white_check_mark: |
| < 1.2.7 | :x:                |

VaultDeck is distributed via Google Play and other stores. Install the latest release for security fixes.

## Reporting a vulnerability

If you discover a security issue, please report it responsibly:

1. **Do not** open a public GitHub issue for exploitable vulnerabilities.
2. Email or open a **private** security advisory on [GitHub](https://github.com/Hyperati-Labs/vaultdeck/security/advisories/new) for this repository.
3. Include steps to reproduce, affected versions, and impact if known.

We aim to acknowledge reports within a few business days and will coordinate disclosure after a fix is available.

## Threat model (summary)

VaultDeck is an **offline-first** mobile vault (iOS and Android only):

- Card data is encrypted at rest (NaCl secretbox) with keys in the OS secure store.
- Unlock uses a **4-digit PIN** (salt + SHA-256) and optional device biometrics.
- Backups are passphrase-encrypted (PBKDF2-SHA256); imports replace local vault data.
- There is **no** analytics, crash reporting, ads, or background network access in the app.

**Trust boundaries:** The app assumes the device OS and secure storage are trustworthy. An attacker with a rooted device, malware, or physical access to an **unlocked** vault may read in-memory or clipboard data.

## Security controls

- PIN lockout after 5 failed attempts (60 seconds); biometrics blocked during lockout.
- Auto-lock when the app backgrounds (configurable).
- Clipboard auto-clear for copied card numbers (configurable timeout).
- Dev-only logging; no sensitive fields in logs (see `AGENTS.md`).

## Known limitations (roadmap)

These are accepted trade-offs or planned improvements, not treated as silent bugs:

- PIN hashing uses a single SHA-256 round (no KDF stretching); changing this requires a migration plan.
- Biometric unlock does not re-verify the vault PIN hash (standard OS biometric gate).
- No `FLAG_SECURE` / screenshot blocking on card screens.
- “Reset vault” removes encrypted card data and vault keys; **PIN and biometric settings remain** until changed separately.
- Reveal/copy of full card numbers may skip extra step-up when biometrics are disabled (vault must already be unlocked).

## Contributor and AI agent guidelines

Automated tools and contributors must follow [AGENTS.md](AGENTS.md), especially:

- Do not weaken crypto, bypass lockout/biometric checks, or add telemetry.
- Do not log PINs, card numbers, keys, or backup payloads.
- Run `npm run check` before submitting changes to crypto, storage, or auth code.
