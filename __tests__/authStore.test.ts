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

import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import { getItem, setItem } from "../src/storage/secureStore";
import { useAuthStore } from "../src/state/authStore";

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

    const ok = await useAuthStore.getState().verifyPin("1234");
    expect(ok).toBe(true);
  });

  it("returns false when no stored pin", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const ok = await useAuthStore.getState().verifyPin("1234");
    expect(ok).toBe(false);
  });

  it("updates pin only when current pin matches", async () => {
    const verify = jest
      .spyOn(useAuthStore.getState(), "verifyPin")
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
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
});
