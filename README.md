# VaultDeck

Minimal, offline-first vault for storing payment card details with biometric/PIN lock, encrypted local storage, and encrypted backups. Built by Hyperati Labs.

## Features

- PIN + biometrics unlock
- Encrypted local vault (device keychain/keystore)
- Encrypted backups with passphrase
- Favorites for quick access
- Tagging and search
- Theme toggle and privacy controls

## Requirements

- Node.js 18+
- Expo CLI

## Development

```sh
npm install
npx expo start
```

Run on device:

- iOS: open with Expo Go or a dev build
- Android: open with Expo Go or a dev build

## Backups

- Exports create a `.vdb` file encrypted with your passphrase.
- Imports require the same passphrase.
- Backups include the vault key, encrypted by the passphrase.

## Project Structure

- `app/` screens (expo-router)
- `src/components/` UI components
- `src/state/` Zustand stores
- `src/storage/` encryption + persistence

## Contributing

PRs welcome. Please open an issue for major changes.

## License

MIT
