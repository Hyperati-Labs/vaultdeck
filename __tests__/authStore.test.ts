jest.mock("../src/storage/secureStore", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: "sha256" },
}));

jest.mock("../src/utils/pinResiliency", () => {
  const { PinOperationError } = jest.requireActual(
    "../src/utils/pinResiliency"
  );
  const actualModule = {
    withPinOperationTimeout: jest.fn(),
    withRetry: jest.fn(),
    validatePinFormat: jest.fn(),
    recordFailedAttempt: jest.fn(),
    resetAttemptCount: jest.fn(),
    isLocked: jest.fn(),
    getLockoutRemainingMs: jest.fn(),
    PinOperationError,
  };

  // Set default implementations
  actualModule.withPinOperationTimeout.mockImplementation((operation) => {
    return operation().then((data: any) => ({
      data,
      error: null,
      isTransient: false,
      retryable: false,
    }));
  });
  actualModule.withRetry.mockImplementation((operation) => operation());
  actualModule.validatePinFormat.mockImplementation((pin) =>
    /^\d{4,8}$/.test(pin)
  );
  actualModule.recordFailedAttempt.mockResolvedValue({
    success: false,
    attemptCount: 1,
    isLocked: false,
    lockoutRemainingMs: 0,
  });
  actualModule.resetAttemptCount.mockResolvedValue(undefined);
  actualModule.isLocked.mockResolvedValue(false);
  actualModule.getLockoutRemainingMs.mockResolvedValue(0);

  return actualModule;
});

import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import { getItem, setItem } from "../src/storage/secureStore";
import { useAuthStore } from "../src/state/authStore";
import {
  withPinOperationTimeout,
  withRetry,
  validatePinFormat,
  recordFailedAttempt,
  resetAttemptCount,
  isLocked,
  getLockoutRemainingMs,
  PinOperationError,
} from "../src/utils/pinResiliency";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      locked: true,
      hasPin: false,
      biometricAvailable: false,
      biometricEnabled: false,
      pinLength: null,
      initialized: false,
      autoLockSeconds: 0,
      autoLockBypass: false,
    });
    jest.clearAllMocks();

    // Restore default implementations after clearAllMocks
    (withPinOperationTimeout as jest.Mock).mockImplementation((operation) => {
      return operation().then((data: any) => ({
        data,
        error: null,
        isTransient: false,
        retryable: false,
      }));
    });
    (withRetry as jest.Mock).mockImplementation((operation) => operation());
    (validatePinFormat as jest.Mock).mockImplementation((pin) =>
      /^\d{4,8}$/.test(pin)
    );
    (recordFailedAttempt as jest.Mock).mockResolvedValue({
      success: false,
      attemptCount: 1,
      isLocked: false,
      lockoutRemainingMs: 0,
    });
    (resetAttemptCount as jest.Mock).mockResolvedValue(undefined);
    (isLocked as jest.Mock).mockResolvedValue(false);
    (getLockoutRemainingMs as jest.Mock).mockResolvedValue(0);
  });

  it("loads auth state with stored values", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("salt")
      .mockResolvedValueOnce("hash")
      .mockResolvedValueOnce("30")
      .mockResolvedValueOnce("true")
      .mockResolvedValueOnce("4");
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

    await useAuthStore.getState().loadAuthState();

    const state = useAuthStore.getState();
    expect(state.hasPin).toBe(true);
    expect(state.biometricAvailable).toBe(true);
    expect(state.biometricEnabled).toBe(true);
    expect(state.pinLength).toBe(4);
    expect(state.autoLockSeconds).toBe(30);
    expect(state.initialized).toBe(true);
    expect(state.locked).toBe(true);
  });

  it("falls back when stored values are invalid", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("not-a-number")
      .mockResolvedValueOnce("false")
      .mockResolvedValueOnce("3");
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
      false
    );
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    await useAuthStore.getState().loadAuthState();

    const state = useAuthStore.getState();
    expect(state.hasPin).toBe(false);
    expect(state.biometricAvailable).toBe(false);
    expect(state.biometricEnabled).toBe(false);
    expect(state.pinLength).toBeNull();
    expect(state.autoLockSeconds).toBe(0);
  });

  it("uses defaults when auto-lock is missing", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("salt")
      .mockResolvedValueOnce("hash")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("false")
      .mockResolvedValueOnce(null);
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
      false
    );
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    await useAuthStore.getState().loadAuthState();

    const state = useAuthStore.getState();
    expect(state.autoLockSeconds).toBe(0);
    expect(state.pinLength).toBeNull();
  });

  it("sets and verifies pin", async () => {
    (Crypto.getRandomBytesAsync as jest.Mock).mockResolvedValue(
      new Uint8Array([1, 2, 3, 4])
    );
    (Crypto.digestStringAsync as jest.Mock).mockResolvedValue("hash");
    (getItem as jest.Mock)
      .mockResolvedValueOnce("salt")
      .mockResolvedValueOnce("hash");

    await useAuthStore.getState().setPin("1234");

    expect(setItem).toHaveBeenCalled();
    expect(useAuthStore.getState().hasPin).toBe(true);
    expect(useAuthStore.getState().pinLength).toBe(4);

    const result = await useAuthStore.getState().verifyPin("1234");
    expect(result.success).toBe(true);
  });

  it("throws when setting invalid pin format", async () => {
    (validatePinFormat as jest.Mock).mockReturnValueOnce(false);

    await expect(useAuthStore.getState().setPin("12")).rejects.toThrow(
      "Invalid PIN format"
    );
  });

  it("throws when setPin operation returns error", async () => {
    (withPinOperationTimeout as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: PinOperationError.TIMEOUT,
      isTransient: true,
      retryable: true,
    });

    await expect(useAuthStore.getState().setPin("1234")).rejects.toThrow(
      "Failed to set PIN: TIMEOUT"
    );
  });

  it("throws when setPin operation returns no data", async () => {
    (withPinOperationTimeout as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: null,
      isTransient: false,
      retryable: false,
    });

    await expect(useAuthStore.getState().setPin("1234")).rejects.toThrow(
      "PIN setup operation failed"
    );
  });

  it("returns false when no stored pin", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const result = await useAuthStore.getState().verifyPin("1234");
    expect(result.success).toBe(false);
  });

  it("updates pin only when current pin matches", async () => {
    const verify = jest
      .spyOn(useAuthStore.getState(), "verifyPin")
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({ success: true });
    const setPin = jest
      .spyOn(useAuthStore.getState(), "setPin")
      .mockResolvedValue();

    const fail = await useAuthStore.getState().updatePin("0000", "1111");
    const ok = await useAuthStore.getState().updatePin("0000", "1111");

    expect(fail).toBe(false);
    expect(ok).toBe(true);
    expect(verify).toHaveBeenCalled();
    expect(setPin).toHaveBeenCalled();
  });

  it("tries biometric when enabled", async () => {
    useAuthStore.setState({ biometricAvailable: true, biometricEnabled: true });
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });

    const ok = await useAuthStore.getState().tryBiometric();

    expect(ok).toBe(true);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
  });

  it("skips biometric when disabled", async () => {
    useAuthStore.setState({
      biometricAvailable: true,
      biometricEnabled: false,
    });

    const ok = await useAuthStore.getState().tryBiometric();

    expect(ok).toBe(false);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });

  it("updates settings", async () => {
    await useAuthStore.getState().setAutoLockSeconds(60);
    await useAuthStore.getState().setBiometricEnabled(true);
    await useAuthStore.getState().setPinLength(6);
    useAuthStore.getState().setAutoLockBypass(true);

    const state = useAuthStore.getState();
    expect(state.autoLockSeconds).toBe(60);
    expect(state.biometricEnabled).toBe(true);
    expect(state.pinLength).toBe(6);
    expect(state.autoLockBypass).toBe(true);
    expect(setItem).toHaveBeenCalled();
  });

  it("locks and unlocks", () => {
    useAuthStore.getState().unlock();
    expect(useAuthStore.getState().locked).toBe(false);
    useAuthStore.getState().lock();
    expect(useAuthStore.getState().locked).toBe(true);
  });

  it("returns false in updatePin when setPin throws error", async () => {
    const verify = jest
      .spyOn(useAuthStore.getState(), "verifyPin")
      .mockResolvedValueOnce({ success: true });
    const setPin = jest
      .spyOn(useAuthStore.getState(), "setPin")
      .mockRejectedValueOnce(new Error("Setup failed"));

    const result = await useAuthStore.getState().updatePin("0000", "1111");

    expect(result).toBe(false);
    expect(verify).toHaveBeenCalled();
    expect(setPin).toHaveBeenCalled();
  });

  it("returns lockout info when user is locked out", async () => {
    (isLocked as jest.Mock).mockResolvedValueOnce(true);
    (getLockoutRemainingMs as jest.Mock).mockResolvedValueOnce(30000);

    const result = await useAuthStore.getState().verifyPin("1234");

    expect(result.success).toBe(false);
    expect(result.resiliency?.isLocked).toBe(true);
    expect(result.resiliency?.lockoutRemainingMs).toBe(30000);
    expect(useAuthStore.getState().pinLocked).toBe(true);
    expect(useAuthStore.getState().pinLockoutRemainingMs).toBe(30000);
  });

  it("returns resiliency error when verification has transient error", async () => {
    (withPinOperationTimeout as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: PinOperationError.TIMEOUT,
      isTransient: true,
      retryable: true,
    });

    const result = await useAuthStore.getState().verifyPin("1234");

    expect(result.success).toBe(false);
    expect(result.resiliency?.error).toContain("temporarily unavailable");
    expect(result.resiliency?.isLocked).toBe(false);
  });

  it("returns false when PIN format is invalid in verifyPin", async () => {
    (validatePinFormat as jest.Mock).mockReturnValueOnce(false);

    const result = await useAuthStore.getState().verifyPin("abc");

    expect(result.success).toBe(false);
    expect(result.resiliency).toBeUndefined();
  });

  it("returns error on unexpected exception in verifyPin", async () => {
    (withPinOperationTimeout as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Unexpected error"))
    );

    const result = await useAuthStore.getState().verifyPin("1234");

    expect(result.success).toBe(false);
    expect(result.resiliency).toBeDefined();
    expect(result.resiliency?.error).toBe("An unexpected error occurred");
  });

  it("returns false when tryBiometric throws error", async () => {
    useAuthStore.setState({ biometricAvailable: true, biometricEnabled: true });
    (withPinOperationTimeout as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Biometric error"))
    );

    const ok = await useAuthStore.getState().tryBiometric();

    expect(ok).toBe(false);
  });

  it("blocks biometric when PIN lockout is active", async () => {
    useAuthStore.setState({ biometricAvailable: true, biometricEnabled: true });
    (isLocked as jest.Mock).mockResolvedValueOnce(true);
    (getLockoutRemainingMs as jest.Mock).mockResolvedValueOnce(45000);

    const ok = await useAuthStore.getState().tryBiometric();

    expect(ok).toBe(false);
    expect(useAuthStore.getState().pinLocked).toBe(true);
    expect(useAuthStore.getState().pinLockoutRemainingMs).toBe(45000);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });

  it("checks PIN lockout status", async () => {
    (isLocked as jest.Mock).mockResolvedValueOnce(true);
    (getLockoutRemainingMs as jest.Mock).mockResolvedValueOnce(15000);

    await useAuthStore.getState().checkPinLockout();

    let state = useAuthStore.getState();
    expect(state.pinLocked).toBe(true);
    expect(state.pinLockoutRemainingMs).toBe(15000);

    // Also check the case when not locked
    (isLocked as jest.Mock).mockResolvedValueOnce(false);
    await useAuthStore.getState().checkPinLockout();
    state = useAuthStore.getState();
    expect(state.pinLocked).toBe(false);
    expect(state.pinLockoutRemainingMs).toBe(0);
  });
});
