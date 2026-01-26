# Privacy Policy for VaultDeck

_Last Updated: January 26, 2026_

Hyperati Labs ("we," "us," or "our") operates the VaultDeck mobile application ("the App"). This Privacy Policy explains our practices regarding the collection, use, and disclosure of information when you use our App.

## 1. Summary

VaultDeck is a minimal, offline-first vault. We do not operate any servers for the App, we do not collect analytics, and we do not sell your data. Your sensitive information is stored exclusively on your device, protected by encryption and your device's native security features.

## 2. Information Collection and Use

VaultDeck does not require account creation and does not collect personal identifiers such as your name, email address, or phone number.

**Data you provide:**

- **Vault Data:** Information you manually enter (e.g., payment card details, tags, and notes) is stored locally on your device.
- **Encrypted Backups:** If you choose to export a backup, a file is created on your device encrypted with a passphrase provided by you.

**Permissions & Device Data:**

- **Biometrics:** The App may request access to your device's biometric hardware (FaceID/Fingerprint) for unlocking. This data is managed by your operating system; the App never accesses or stores your actual biometric templates.
- **Local Storage:** The App uses Expo SecureStore and the local FileSystem to store encrypted data.
- **Clipboard:** The App may access the clipboard only when you choose to copy data. You can manage clipboard security settings (such as timeouts) within the App.

## 3. Data Encryption and Security

Security is the core of VaultDeck.

- **On-Device Encryption:** All vault data is encrypted locally using the tweetnacl cryptographic library with a 256-bit symmetric key.
- **Key Management:** Your encryption keys are stored in the device's secure hardware (SecureStore).
- **Encryption in Transit:** While the App is offline-first, any data processed within the App is handled using industry-standard encryption. Any data shared by the user (e.g., via the export feature) is encrypted before leaving the App environment.

## 4. Sharing of Information

We do not sell or share your personal information. Specifically, VaultDeck does not access, collect, or share your financial data (such as credit card numbers) for any purpose other than providing the local storage and management features described in this App. Data only leaves your device if you explicitly initiate a "Share" or "Export" action for an encrypted backup file.

## 5. Third-Party Services

VaultDeck does not integrate third-party analytics, advertising SDKs, or tracking tools. It relies solely on standard system APIs provided by your device's operating system (iOS/Android).

## 6. Data Retention and Deletion

Your data remains on your device as long as the App is installed.

- **Manual Deletion:** You can delete individual items or use the "Reset Vault" feature within the App to wipe all local data.
- **App Uninstallation:** Deleting the App will remove all locally stored vault data. Because we do not store your data on servers, we cannot recover deleted data for you.

## 7. Children's Privacy

The App is not directed to children under 13. We do not knowingly collect personal information from children, as we do not collect personal identifiers from any user.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## 9. Contact Us

If you have any questions about this Privacy Policy, please contact us:

- **Developer:** Hyperati Labs
- **Email:** hyperati.labs@gmail.com
