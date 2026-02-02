import { create } from "zustand";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";
import { encodeBase64 } from "tweetnacl-util";

import { getItem, setItem } from "../storage/secureStore";
import {
  withPinOperationTimeout,
  withRetry,
  validatePinFormat,
  recordFailedAttempt,
  resetAttemptCount,
  isLocked,
  getLockoutRemainingMs,
  PinResiliencyResult,
} from "../utils/pinResiliency";

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
  pinAttemptCount: number;
  pinLocked: boolean;
  pinLockoutRemainingMs: number;
  loadAuthState: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  setAutoLockBypass: (enabled: boolean) => void;
  setPin: (pin: string) => Promise<void>;
  updatePin: (currentPin: string, nextPin: string) => Promise<boolean>;
  verifyPin: (
    pin: string
  ) => Promise<{ success: boolean; resiliency?: PinResiliencyResult }>;
  tryBiometric: () => Promise<boolean>;
  setAutoLockSeconds: (seconds: number) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setPinLength: (length: number) => Promise<void>;
  checkPinLockout: () => Promise<void>;
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
  pinAttemptCount: 0,
  pinLocked: false,
  pinLockoutRemainingMs: 0,
  loadAuthState: async () => {
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
  },
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
  setAutoLockBypass: (enabled: boolean) => set({ autoLockBypass: enabled }),
  setPin: async (pin: string) => {
    if (!validatePinFormat(pin)) {
      throw new Error("Invalid PIN format");
    }
    try {
      const result = await withPinOperationTimeout(async () => {
        const saltBytes = await Crypto.getRandomBytesAsync(16);
        const saltBase64 = encodeBase64(saltBytes);
        const hash = await hashPin(pin, saltBase64);
        return { saltBase64, hash };
      });

      if (result.error) {
        throw new Error(`Failed to set PIN: ${result.error}`);
      }

      if (!result.data) {
        throw new Error("PIN setup operation failed");
      }

      await withRetry(async () => {
        await Promise.all([
          setItem(PIN_SALT_KEY, result.data!.saltBase64),
          setItem(PIN_HASH_KEY, result.data!.hash),
          setItem(PIN_LENGTH_KEY, String(pin.length)),
        ]);
      });

      set({ hasPin: true, pinLength: pin.length });
      await resetAttemptCount();
    } catch (error) {
      throw new Error(`Failed to set PIN: ${String(error)}`);
    }
  },
  updatePin: async (currentPin: string, nextPin: string) => {
    const verifyResult = await get().verifyPin(currentPin);
    if (!verifyResult.success) {
      return false;
    }
    try {
      await get().setPin(nextPin);
      return true;
    } catch {
      return false;
    }
  },
  verifyPin: async (pin: string) => {
    // Check lockout first
    const locked = await isLocked();
    if (locked) {
      const remainingMs = await getLockoutRemainingMs();
      set({ pinLocked: true, pinLockoutRemainingMs: remainingMs });
      return {
        success: false,
        resiliency: {
          success: false,
          attemptCount: 5,
          isLocked: true,
          lockoutRemainingMs: remainingMs,
          error: `Too many failed attempts. Locked for ${Math.ceil(remainingMs / 1000)} seconds.`,
        },
      };
    }

    // Validate format
    if (!validatePinFormat(pin)) {
      return { success: false };
    }

    try {
      const result = await withPinOperationTimeout(async () => {
        return withRetry(async () => {
          const [salt, storedHash] = await Promise.all([
            getItem(PIN_SALT_KEY),
            getItem(PIN_HASH_KEY),
          ]);
          if (!salt || !storedHash) {
            return false;
          }
          const hash = await hashPin(pin, salt);
          return hash === storedHash;
        });
      });

      if (result.error) {
        // Transient error - don't count as failed attempt
        return {
          success: false,
          resiliency: {
            success: false,
            attemptCount: 0,
            isLocked: false,
            lockoutRemainingMs: 0,
            error: result.isTransient
              ? "Verification temporarily unavailable. Please try again."
              : "Verification failed. Please try again.",
          },
        };
      }

      if (result.data) {
        // Success
        await resetAttemptCount();
        set({ pinAttemptCount: 0, pinLocked: false, pinLockoutRemainingMs: 0 });
        return { success: true };
      }

      // Wrong PIN - record failed attempt
      const resilResult = await recordFailedAttempt();
      set({
        pinAttemptCount: resilResult.attemptCount,
        pinLocked: resilResult.isLocked,
        pinLockoutRemainingMs: resilResult.lockoutRemainingMs,
      });
      return { success: false, resiliency: resilResult };
    } catch (error) {
      return {
        success: false,
        resiliency: {
          success: false,
          attemptCount: 0,
          isLocked: false,
          lockoutRemainingMs: 0,
          error: "An unexpected error occurred",
        },
      };
    }
  },
  checkPinLockout: async () => {
    const locked = await isLocked();
    const remainingMs = locked ? await getLockoutRemainingMs() : 0;
    set({
      pinLocked: locked,
      pinLockoutRemainingMs: remainingMs,
    });
  },
  tryBiometric: async () => {
    const { biometricAvailable, biometricEnabled } = get();
    if (!biometricAvailable || !biometricEnabled) {
      return false;
    }
    try {
      const result = await withPinOperationTimeout(async () => {
        return LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock VaultDeck",
          fallbackLabel: "Use PIN",
          cancelLabel: "Cancel",
        });
      });
      return result.data?.success ?? false;
    } catch {
      return false;
    }
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
