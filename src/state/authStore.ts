import { create } from "zustand";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";
import { encodeBase64 } from "tweetnacl-util";

import { logger } from "../utils/logger";

import { getItem, setItem } from "../storage/secureStore";

const PIN_SALT_KEY = "vault_pin_salt_v1";
const PIN_HASH_KEY = "vault_pin_hash_v1";
const AUTO_LOCK_SECONDS_KEY = "vault_auto_lock_seconds_v1";
const BIOMETRIC_ENABLED_KEY = "vault_biometric_enabled_v1";
const PIN_LENGTH_KEY = "vault_pin_length_v1";

const DEFAULT_AUTO_LOCK_SECONDS = 0;

type AuthState = {
  locked: boolean;
  hasPin: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  pinLength: number | null;
  initialized: boolean;
  autoLockSeconds: number;
  autoLockBypass: boolean;
  loadAuthState: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  setAutoLockBypass: (enabled: boolean) => void;
  setPin: (pin: string) => Promise<void>;
  updatePin: (currentPin: string, nextPin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  tryBiometric: () => Promise<boolean>;
  setAutoLockSeconds: (seconds: number) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setPinLength: (length: number) => Promise<void>;
};

async function hashPin(pin: string, saltBase64: string): Promise<string> {
  const payload = `${saltBase64}:${pin}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  locked: true,
  hasPin: false,
  biometricAvailable: false,
  biometricEnabled: false,
  pinLength: null,
  initialized: false,
  autoLockSeconds: DEFAULT_AUTO_LOCK_SECONDS,
  autoLockBypass: false,
  loadAuthState: async () => {
    const start = Date.now();
    const [salt, hash, autoLock, biometricEnabled, pinLengthRaw] =
      await Promise.all([
        getItem(PIN_SALT_KEY),
        getItem(PIN_HASH_KEY),
        getItem(AUTO_LOCK_SECONDS_KEY),
        getItem(BIOMETRIC_ENABLED_KEY),
        getItem(PIN_LENGTH_KEY),
      ]);
    const hasPin = Boolean(salt && hash);
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    const autoLockSeconds = autoLock
      ? Number(autoLock)
      : DEFAULT_AUTO_LOCK_SECONDS;
    const parsedPinLength = pinLengthRaw ? Number(pinLengthRaw) : null;
    const pinLength =
      parsedPinLength && parsedPinLength >= 4 && parsedPinLength <= 8
        ? parsedPinLength
        : null;
    set({
      hasPin,
      biometricAvailable: hasHardware && isEnrolled,
      biometricEnabled: biometricEnabled === "true",
      pinLength,
      initialized: true,
      locked: true,
      autoLockSeconds: Number.isFinite(autoLockSeconds)
        ? autoLockSeconds
        : DEFAULT_AUTO_LOCK_SECONDS,
    });
    // Debug timing to confirm SecureStore responses in dev.
    logger.info("Auth state loaded", { ms: Date.now() - start });
  },
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
  setAutoLockBypass: (enabled: boolean) => set({ autoLockBypass: enabled }),
  setPin: async (pin: string) => {
    const saltBytes = await Crypto.getRandomBytesAsync(16);
    const saltBase64 = encodeBase64(saltBytes);
    const hash = await hashPin(pin, saltBase64);
    await Promise.all([
      setItem(PIN_SALT_KEY, saltBase64),
      setItem(PIN_HASH_KEY, hash),
      setItem(PIN_LENGTH_KEY, String(pin.length)),
    ]);
    set({ hasPin: true, pinLength: pin.length });
  },
  updatePin: async (currentPin: string, nextPin: string) => {
    const ok = await get().verifyPin(currentPin);
    if (!ok) {
      return false;
    }
    await get().setPin(nextPin);
    return true;
  },
  verifyPin: async (pin: string) => {
    const [salt, storedHash] = await Promise.all([
      getItem(PIN_SALT_KEY),
      getItem(PIN_HASH_KEY),
    ]);
    if (!salt || !storedHash) {
      return false;
    }
    const hash = await hashPin(pin, salt);
    return hash === storedHash;
  },
  tryBiometric: async () => {
    const { biometricAvailable, biometricEnabled } = get();
    if (!biometricAvailable || !biometricEnabled) {
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock VaultDeck",
      fallbackLabel: "Use PIN",
      cancelLabel: "Cancel",
    });
    return result.success;
  },
  setAutoLockSeconds: async (seconds: number) => {
    await setItem(AUTO_LOCK_SECONDS_KEY, String(seconds));
    set({ autoLockSeconds: seconds });
  },
  setBiometricEnabled: async (enabled: boolean) => {
    await setItem(BIOMETRIC_ENABLED_KEY, String(enabled));
    set({ biometricEnabled: enabled });
  },
  setPinLength: async (length: number) => {
    await setItem(PIN_LENGTH_KEY, String(length));
    set({ pinLength: length });
  },
}));
