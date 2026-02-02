jest.mock("../src/storage/secureStore", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  deleteItem: jest.fn(),
}));

import {
  withPinOperationTimeout,
  getAttemptCount,
  isLocked,
  recordFailedAttempt,
  resetAttemptCount,
  validatePinFormat,
  getErrorMessage,
  PinOperationError,
  getLockoutRemainingMs,
} from "../src/utils/pinResiliency";
import * as SecureStore from "../src/storage/secureStore";

const mockSetItem = jest.spyOn(SecureStore, "setItem");
const mockGetItem = jest.spyOn(SecureStore, "getItem");
const mockDeleteItem = jest.spyOn(SecureStore, "deleteItem");

describe("pinResiliency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockDeleteItem.mockResolvedValue(undefined);
  });

  describe("withPinOperationTimeout", () => {
    it("successfully completes operation within timeout", async () => {
      const operation = jest.fn().mockResolvedValue("success");
      const result = await withPinOperationTimeout(operation, 5000);

      expect(result.data).toBe("success");
      expect(result.error).toBeNull();
      expect(result.isTransient).toBe(false);
      expect(result.retryable).toBe(false);
    });

    it("times out operation exceeding timeout", async () => {
      jest.useFakeTimers();
      try {
        const operation = jest.fn(
          () => new Promise((resolve) => setTimeout(resolve, 3000))
        );
        const resultPromise = withPinOperationTimeout(operation, 100);
        jest.advanceTimersByTime(100);
        const result = await resultPromise;
        expect(result.error).toBe(PinOperationError.TIMEOUT);
        expect(result.isTransient).toBe(true);
        expect(result.retryable).toBe(true);
      } finally {
        jest.runAllTimers();
        jest.useRealTimers();
      }
    });

    it("classifies crypto errors as retryable", async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Crypto operation timeout"));
      const result = await withPinOperationTimeout(operation);

      expect(result.error).toBe(PinOperationError.TIMEOUT);
      expect(result.isTransient).toBe(true);
      expect(result.retryable).toBe(true);
    });

    it("classifies storage errors as retryable", async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("SecureStore unavailable"));
      const result = await withPinOperationTimeout(operation);

      expect(result.error).toBe(PinOperationError.STORAGE_ERROR);
      expect(result.isTransient).toBe(true);
      expect(result.retryable).toBe(true);
    });

    it("classifies validation errors as permanent", async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Invalid pin format"));
      const result = await withPinOperationTimeout(operation);

      expect(result.error).toBe(PinOperationError.VALIDATION_ERROR);
      expect(result.isTransient).toBe(false);
      expect(result.retryable).toBe(false);
    });
  });

  describe("attempt tracking", () => {
    it("tracks initial attempt count", async () => {
      mockGetItem.mockResolvedValue(null);
      const count = await getAttemptCount();
      expect(count).toBe(0);
    });

    it("retrieves stored attempt count", async () => {
      mockGetItem.mockResolvedValue("3");
      const count = await getAttemptCount();
      expect(count).toBe(3);
    });

    it("caps attempt count at max", async () => {
      mockGetItem.mockResolvedValue("100");
      const count = await getAttemptCount();
      expect(count).toBe(5); // MAX_ATTEMPTS
    });

    it("records failed attempt and increments count", async () => {
      mockGetItem.mockResolvedValue("2");
      const result = await recordFailedAttempt();

      expect(result.success).toBe(false);
      expect(result.attemptCount).toBe(3);
      expect(result.isLocked).toBe(false);
      expect(mockSetItem).toHaveBeenCalledWith(
        "vault_pin_attempt_count_v1",
        "3"
      );
    });

    it("triggers lockout at max attempts", async () => {
      mockGetItem.mockResolvedValue("4");
      const result = await recordFailedAttempt();

      expect(result.success).toBe(false);
      expect(result.attemptCount).toBe(5);
      expect(result.isLocked).toBe(true);
      expect(result.lockoutRemainingMs).toBe(60000);
      expect(mockSetItem).toHaveBeenCalledWith(
        "vault_pin_lockout_timestamp_v1",
        expect.any(String)
      );
    });

    it("resets attempt count on success", async () => {
      await resetAttemptCount();
      expect(mockSetItem).toHaveBeenCalledWith(
        "vault_pin_attempt_count_v1",
        "0"
      );
      expect(mockDeleteItem).toHaveBeenCalledWith(
        "vault_pin_lockout_timestamp_v1"
      );
    });
  });

  describe("lockout mechanism", () => {
    it("determines lockout status", async () => {
      const now = Date.now();
      const lockoutTime = now - 30000; // 30 seconds ago
      mockGetItem.mockResolvedValue(String(lockoutTime));

      const locked = await isLocked();
      expect(locked).toBe(true);
    });

    it("expires lockout after duration", async () => {
      const now = Date.now();
      const lockoutTime = now - 90000; // 90 seconds ago (past 60s lockout)
      mockGetItem.mockResolvedValue(String(lockoutTime));

      const locked = await isLocked();
      expect(locked).toBe(false);
      expect(mockSetItem).toHaveBeenCalledWith(
        "vault_pin_attempt_count_v1",
        "0"
      );
      expect(mockDeleteItem).toHaveBeenCalledWith(
        "vault_pin_lockout_timestamp_v1"
      );
    });

    it("calculates remaining lockout time", async () => {
      const now = Date.now();
      const lockoutTime = now - 30000; // 30 seconds ago, 30s remaining
      mockGetItem.mockResolvedValue(String(lockoutTime));

      const remaining = await getLockoutRemainingMs();
      expect(remaining).toBeGreaterThan(25000);
      expect(remaining).toBeLessThanOrEqual(30000);
    });

    it("allows attempts to increment after lockout expires", async () => {
      const now = Date.now();
      const lockoutTime = now - 90000; // expired lockout
      mockGetItem
        .mockResolvedValueOnce(String(lockoutTime)) // isLocked timestamp
        .mockResolvedValueOnce("0"); // recordFailedAttempt current count after reset

      const locked = await isLocked();
      expect(locked).toBe(false);
      const result = await recordFailedAttempt();
      expect(result.attemptCount).toBe(1);
      expect(mockDeleteItem).toHaveBeenCalledWith(
        "vault_pin_lockout_timestamp_v1"
      );
      expect(mockSetItem).toHaveBeenLastCalledWith(
        "vault_pin_attempt_count_v1",
        "1"
      );
    });
  });

  describe("PIN format validation", () => {
    it("accepts valid PINs", () => {
      expect(validatePinFormat("1234")).toBe(true);
      expect(validatePinFormat("12345678")).toBe(true);
      expect(validatePinFormat("000000")).toBe(true);
    });

    it("rejects invalid PINs", () => {
      expect(validatePinFormat("123")).toBe(false); // too short
      expect(validatePinFormat("123456789")).toBe(false); // too long
      expect(validatePinFormat("12a4")).toBe(false); // non-numeric
      expect(validatePinFormat("")).toBe(false); // empty
    });
  });

  describe("error messages", () => {
    it("provides user-friendly error messages", () => {
      expect(getErrorMessage(PinOperationError.TIMEOUT)).toContain("timed out");
      expect(getErrorMessage(PinOperationError.STORAGE_ERROR)).toContain(
        "secure storage"
      );
      expect(getErrorMessage(PinOperationError.CRYPTO_ERROR)).toContain(
        "Encryption"
      );
      expect(getErrorMessage(PinOperationError.VALIDATION_ERROR)).toContain(
        "PIN format"
      );
    });
  });
});
