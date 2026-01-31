# VaultDeck

Minimal, offline-first vault for storing payment card details with biometric/PIN lock, encrypted local storage, and encrypted backups. Built by Hyperati Labs.

## Features

### Security & Authentication

- PIN + biometric unlock (Face ID / Touch ID / Fingerprint)
- Encrypted local vault (device keychain/keystore)
- Encrypted backups with passphrase protection
- Auto-lock with configurable timeout
- Clipboard auto-clear with customizable duration
- Privacy shield when app backgrounded

### Card Management

- Gesture-based card interactions (3D rotation and tilt)
- Card favorites for quick access
- Comprehensive tagging system with:
  - Per-tag custom colors with color picker
  - Real-time search and filtering
  - Tag manager with rename and delete functionality
  - Tag statistics (total tags, tagged/untagged cards)
- Responsive card display across all device sizes

### Customization

- Dynamic accent color customization
- Dark/light theme toggle (auto or manual)
- Haptic feedback on Android
- Glassmorphic UI with modern design

## Requirements

- Node.js 18+
- Expo CLI

## Development

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode (for iOS development)
- Android: Android Studio and SDK tools (for Android development)

### Setup

```sh
# Install dependencies
npm install

# Start the development server
npx expo start
```

### Run on Device

**Using Expo Go (quickest):**

```sh
# Scan the QR code with Expo Go (iOS) or use Android's built-in camera
npx expo start

# For iOS: Open in Expo Go
# For Android: Press 'a' in terminal or scan QR code
```

**Using Development Build (recommended for testing all features):**

```sh
# iOS
npm run ios

# Android
npm run android
```

**Web (limited functionality):**

```sh
npm run web
```

### Scripts

- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking
- `npm run test` - Run Jest tests with coverage
- `npm run check` - Run all checks (lint, typecheck, test, audit)
- `npm run deploy` - Build and deploy to web
- `npm start` - Start development server

## Backups & Import/Export

### Backup Format

- Exports create encrypted `.vdb` (Vault Deck Backup) files
- All card data is encrypted with your passphrase using AES-256-GCM
- The vault encryption key is included in the backup (also encrypted by the passphrase)

### Using Backups

- **Export**: Settings → Data Management → Export Backup
  - Creates a `.vdb` file in your device's Downloads folder
  - Encrypted with a passphrase of your choice
- **Import**: Settings → Data Management → Import Backup
  - Requires the same passphrase used during export
  - Replaces your current vault with the imported backup

### Security Notes

- Backups are client-side encrypted; only you can decrypt them
- Passphrases must be strong (recommended 12+ characters)
- Store backup files securely; they contain sensitive data

## Settings

### Security

- **Change PIN**: Update your vault PIN
- **Biometrics**: Enable/disable biometric authentication (requires PIN)
- **Auto-lock**: Set inactivity timeout (Instant, 30s, 1m, 5m)
- **Clipboard Timeout**: Auto-clear clipboard (10s, 30s, 1m, 5m)

### Appearance

- **Theme**: Light, dark, or automatic (device setting)
- **Accent Color**: Customize accent color from preset swatches
- **Manage Tags**: Full tag management interface (rename, delete, customize colors)

### Feedback

- **Haptics**: Enable/disable haptic feedback (Android only)

### Data Management

- **Export Backup**: Create encrypted backup file
- **Import Backup**: Restore from backup file
- **Reset Vault**: Permanently delete all cards (with confirmation)

### About

- App version and GitHub repository link

## Contributing

PRs welcome. Please open an issue for major changes.

## License

MIT
