jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const authState = { biometricEnabled: false };
jest.mock("../src/state/authStore", () => ({
  useAuthStore: {
    getState: () => authState,
  },
}));

import * as LocalAuthentication from "expo-local-authentication";
import { requireSensitiveAuth } from "../src/utils/sensitiveAuth";

describe("requireSensitiveAuth", () => {
  beforeEach(() => {
    authState.biometricEnabled = false;
    jest.clearAllMocks();
  });

  it("returns true when biometrics disabled", async () => {
    const ok = await requireSensitiveAuth("Test");
    expect(ok).toBe(true);
    expect(LocalAuthentication.hasHardwareAsync).not.toHaveBeenCalled();
  });

  it("returns true when device not enrolled", async () => {
    authState.biometricEnabled = true;
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    const ok = await requireSensitiveAuth("Test");

    expect(ok).toBe(true);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });

  it("authenticates when available", async () => {
    authState.biometricEnabled = true;
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });

    const ok = await requireSensitiveAuth("Test");

    expect(ok).toBe(true);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: "Test",
      fallbackLabel: "Use PIN",
      cancelLabel: "Cancel",
    });
  });
});
