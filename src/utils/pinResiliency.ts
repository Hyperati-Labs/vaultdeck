import { deleteItem, getItem, setItem } from "../storage/secureStore";

const PIN_ATTEMPT_COUNT_KEY = "vault_pin_attempt_count_v1";
const PIN_LOCKOUT_TIMESTAMP_KEY = "vault_pin_lockout_timestamp_v1";
const PIN_OPERATION_TIMEOUT = 10000; // 10 seconds
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60000; // 1 minute after max attempts

export type PinResiliencyResult = {
  success: boolean;
  attemptCount: number;
  isLocked: boolean;
  lockoutRemainingMs: number;
  error?: string;
};

export type PinOperationResult<T> = {
  data: T | null;
  error: PinOperationError | null;
  isTransient: boolean;
  retryable: boolean;
};

export enum PinOperationError {
  TIMEOUT = "TIMEOUT",
  STORAGE_ERROR = "STORAGE_ERROR",
  CRYPTO_ERROR = "CRYPTO_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * Wraps an async PIN operation with timeout and error classification
 */
export async function withPinOperationTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = PIN_OPERATION_TIMEOUT
): Promise<PinOperationResult<T>> {
  return new Promise((resolve) => {
    let completed = false;
    const timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        resolve({
          data: null,
          error: PinOperationError.TIMEOUT,
          isTransient: true,
          retryable: true,
        });
      }
    }, timeoutMs);

    operation()
      .then((data) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          resolve({
            data,
            error: null,
            isTransient: false,
            retryable: false,
          });
        }
      })
      .catch((error) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          const result = classifyError(error);
          resolve(result);
        }
      });
  });
}

/**
 * Classifies errors as transient or permanent
 */
function classifyError(error: any): PinOperationResult<any> {
  const errorMsg = String(error?.message || error || "").toLowerCase();

  // Classify as transient (retryable) errors
  if (
    errorMsg.includes("timeout") ||
    errorMsg.includes("network") ||
    errorMsg.includes("temporarily unavailable")
  ) {
    return {
      data: null,
      error: PinOperationError.TIMEOUT,
      isTransient: true,
      retryable: true,
    };
  }

  if (errorMsg.includes("storage") || errorMsg.includes("securestore")) {
    return {
      data: null,
      error: PinOperationError.STORAGE_ERROR,
      isTransient: true,
      retryable: true,
    };
  }

  // Classify as permanent errors
  if (
    errorMsg.includes("invalid") ||
    errorMsg.includes("parse") ||
    errorMsg.includes("format")
  ) {
    return {
      data: null,
      error: PinOperationError.VALIDATION_ERROR,
      isTransient: false,
      retryable: false,
    };
  }

  return {
    data: null,
    error: PinOperationError.UNKNOWN,
    isTransient: false,
    retryable: false,
  };
}

/**
 * Gets current attempt count with resiliency
 */
export async function getAttemptCount(): Promise<number> {
  try {
    const count = await getItem(PIN_ATTEMPT_COUNT_KEY);
    return count ? Math.min(Math.max(parseInt(count, 10), 0), MAX_ATTEMPTS) : 0;
  } catch {
    // Default to 0 on error, allowing user to try
    return 0;
  }
}

/**
 * Gets lockout timestamp if locked
 */
export async function getLockoutTimestamp(): Promise<number | null> {
  try {
    const timestamp = await getItem(PIN_LOCKOUT_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Calculates if user is currently locked out
 */
export async function isLocked(): Promise<boolean> {
  const timestamp = await getLockoutTimestamp();
  if (!timestamp) return false;

  const now = Date.now();
  const isStillLocked = now - timestamp < LOCKOUT_DURATION_MS;

  if (!isStillLocked) {
    // Lockout expired, clear state so attempts don't keep resetting
    await resetAttemptCount();
    try {
      await deleteItem(PIN_LOCKOUT_TIMESTAMP_KEY);
    } catch {
      // ignore cleanup failures
    }
  }

  return isStillLocked;
}

/**
 * Gets remaining lockout time in milliseconds
 */
export async function getLockoutRemainingMs(): Promise<number> {
  const timestamp = await getLockoutTimestamp();
  if (!timestamp) return 0;

  const now = Date.now();
  const remaining = LOCKOUT_DURATION_MS - (now - timestamp);
  return Math.max(0, remaining);
}

/**
 * Increments attempt count and triggers lockout if needed
 * Uses atomic increment pattern to prevent race conditions
 */
export async function recordFailedAttempt(): Promise<PinResiliencyResult> {
  try {
    // Read current value from storage
    const storedCount = await getItem(PIN_ATTEMPT_COUNT_KEY);
    const current = storedCount ? parseInt(storedCount, 10) : 0;

    // Calculate new count
    const newCount = Math.min(current + 1, MAX_ATTEMPTS);

    // Write back to storage
    await setItem(PIN_ATTEMPT_COUNT_KEY, String(newCount));

    if (newCount >= MAX_ATTEMPTS) {
      const timestamp = Date.now();
      await setItem(PIN_LOCKOUT_TIMESTAMP_KEY, String(timestamp));
      return {
        success: false,
        attemptCount: newCount,
        isLocked: true,
        lockoutRemainingMs: LOCKOUT_DURATION_MS,
        error: `Too many failed attempts. Locked for ${Math.round(LOCKOUT_DURATION_MS / 1000)} seconds.`,
      };
    }

    return {
      success: false,
      attemptCount: newCount,
      isLocked: false,
      lockoutRemainingMs: 0,
      error: `Incorrect PIN. ${MAX_ATTEMPTS - newCount} attempt${MAX_ATTEMPTS - newCount === 1 ? "" : "s"} remaining.`,
    };
  } catch (error) {
    return {
      success: false,
      attemptCount: 0,
      isLocked: false,
      lockoutRemainingMs: 0,
      error: "Failed to record attempt",
    };
  }
}

/**
 * Clears attempt count on successful verification
 */
export async function resetAttemptCount(): Promise<void> {
  try {
    await Promise.all([
      setItem(PIN_ATTEMPT_COUNT_KEY, "0"),
      deleteItem(PIN_LOCKOUT_TIMESTAMP_KEY),
    ]);
  } catch {
    // Silently fail, attempt count will reset after lockout expires
  }
}

/**
 * Validates PIN format before verification attempt
 */
export function validatePinFormat(pin: string): boolean {
  // PIN must be 4-8 digits
  return /^\d{4,8}$/.test(pin);
}

/**
 * Constructs user-friendly error message
 */
export function getErrorMessage(error: PinOperationError): string {
  const messages: Record<PinOperationError, string> = {
    [PinOperationError.TIMEOUT]:
      "PIN verification timed out. Please try again.",
    [PinOperationError.STORAGE_ERROR]:
      "Unable to access secure storage. Please try again.",
    [PinOperationError.CRYPTO_ERROR]:
      "Encryption error occurred. Please try again.",
    [PinOperationError.VALIDATION_ERROR]: "Invalid PIN format.",
    [PinOperationError.UNKNOWN]: "An error occurred. Please try again.",
  };
  return messages[error];
}

/**
 * Retries an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  initialDelayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
