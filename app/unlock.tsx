import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../src/components/Screen";
import { useAuthStore } from "../src/state/authStore";
import { useTheme } from "../src/utils/useTheme";
import { responsiveFontSize, responsiveSpacing } from "../src/utils/responsive";

const PIN_LENGTH = 4;

export default function UnlockScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const {
    locked,
    hasPin,
    biometricAvailable,
    biometricEnabled,
    pinLength,
    tryBiometric,
    setPin,
    setPinLength,
    verifyPin,
    unlock,
    initialized,
    pinLocked,
    pinLockoutRemainingMs,
    checkPinLockout,
  } = useAuthStore();
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [activeField, setActiveField] = useState<"pin" | "confirm">("pin");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const isVerifying = useRef(false);
  const lastAttemptRef = useRef<string | null>(null);
  const isMounted = useRef(true);
  const autoBiometricAttempted = useRef(false);

  // Refresh lockout status when screen mounts or app returns to foreground
  useEffect(() => {
    if (!initialized || !locked) {
      return;
    }
    checkPinLockout();
  }, [initialized, locked, appState, checkPinLockout]);

  // Lockout timer effect
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          checkPinLockout();
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer, checkPinLockout]);

  // Update lockout timer when lockout changes
  useEffect(() => {
    if (pinLocked) {
      setLockoutTimer(Math.ceil(pinLockoutRemainingMs / 1000));
    } else {
      setLockoutTimer(0);
      setError("");
    }
  }, [pinLocked, pinLockoutRemainingMs]);

  useEffect(() => {
    isMounted.current = true;
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppState(nextState);
    });
    return () => {
      isMounted.current = false;
      subscription.remove();
    };
  }, []);

  const isSetup = !hasPin;

  useEffect(() => {
    if (!locked) {
      return;
    }
    autoBiometricAttempted.current = false;
  }, [locked]);

  useEffect(() => {
    if (!initialized) {
      return;
    }
    if (appState !== "active") {
      return;
    }
    if (!locked) {
      return;
    }
    if (autoBiometricAttempted.current) {
      return;
    }
    const attemptBiometric = async () => {
      if (!hasPin || !biometricAvailable || !biometricEnabled || busy) {
        return;
      }
      autoBiometricAttempted.current = true;
      setBusy(true);
      try {
        const success = await tryBiometric();
        if (success && isMounted.current) {
          unlock();
        }
      } catch (error) {
        void error;
      } finally {
        if (isMounted.current) {
          setBusy(false);
        }
      }
    };
    attemptBiometric();
  }, [
    busy,
    biometricAvailable,
    biometricEnabled,
    hasPin,
    initialized,
    appState,
    locked,
    tryBiometric,
    unlock,
  ]);

  useEffect(() => {
    if (busy && !isVerifying.current) {
      return;
    }

    const attemptUnlock = async () => {
      if (isSetup) {
        if (pin.length < PIN_LENGTH || confirmPin.length < PIN_LENGTH) {
          return;
        }
        if (confirmPin.length !== pin.length) {
          return;
        }
        if (pin !== confirmPin) {
          setError("PINs do not match.");
          setConfirmPin("");
          return;
        }
        setError("");
        setBusy(true);
        isVerifying.current = true;
        try {
          await setPin(pin);
          if (isMounted.current) {
            unlock();
          }
        } catch (err) {
          if (isMounted.current) {
            setError(String(err).replace("Error: ", ""));
          }
        } finally {
          isVerifying.current = false;
          if (isMounted.current) {
            setBusy(false);
          }
        }
        return;
      }

      const targetLength = PIN_LENGTH;
      if (pin.length < targetLength) {
        return;
      }
      if (lastAttemptRef.current === pin) {
        return;
      }
      if (isVerifying.current) {
        return;
      }

      lastAttemptRef.current = pin;
      setError("");
      setBusy(true);
      isVerifying.current = true;
      try {
        const result = await verifyPin(pin);
        if (!result.success) {
          if (pin.length >= PIN_LENGTH) {
            // Use resiliency error if available
            if (result.resiliency?.error) {
              setError(result.resiliency.error);
              if (result.resiliency.isLocked) {
                setLockoutTimer(
                  Math.ceil(result.resiliency.lockoutRemainingMs / 1000)
                );
              }
            } else {
              setError("Incorrect PIN.");
            }
            setPinValue("");
            lastAttemptRef.current = ""; // Reset to empty string instead of null
          }
          return;
        }
        if (!pinLength || pinLength !== pin.length) {
          await setPinLength(pin.length);
        }
        if (isMounted.current) {
          unlock();
        }
      } finally {
        isVerifying.current = false;
        if (isMounted.current) {
          setBusy(false);
        }
      }
    };
    attemptUnlock();
  }, [
    busy,
    confirmPin.length,
    confirmPin,
    isSetup,
    pin.length,
    pin,
    pinLength,
    setPin,
    setPinLength,
    unlock,
    verifyPin,
  ]);

  const handleDigit = (digit: number) => {
    if (busy || pinLocked) {
      return;
    }
    setError("");
    if (isSetup && activeField === "confirm") {
      if (confirmPin.length >= PIN_LENGTH) {
        return;
      }
      setConfirmPin((current) => current + String(digit));
      return;
    }
    if (pin.length >= PIN_LENGTH) {
      return;
    }
    const newPin = pin + String(digit);
    setPinValue(newPin);

    if (isSetup && newPin.length === PIN_LENGTH) {
      setActiveField("confirm");
    }
  };

  const handleBackspace = () => {
    if (busy || pinLocked) {
      return;
    }
    if (isSetup && activeField === "confirm") {
      setConfirmPin((current) => current.slice(0, -1));
      return;
    }
    setPinValue((current) => current.slice(0, -1));
  };

  const handleBiometric = async () => {
    if (!hasPin || !biometricAvailable || !biometricEnabled || busy) {
      return;
    }
    setError("");
    setBusy(true);
    try {
      const ok = await tryBiometric();
      if (ok) {
        unlock();
      }
    } finally {
      if (isMounted.current) {
        setBusy(false);
      }
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View>
          <Text style={styles.kicker}>Secure access</Text>
          <Text style={styles.title}>VaultDeck</Text>
          <Text style={styles.subtitle}>
            {isSetup ? "Set a PIN to protect your vault." : ""}
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.pinContainer}>
          <Text style={styles.pinTitle}>
            {isSetup
              ? activeField === "pin"
                ? "Create your PIN"
                : "Confirm your PIN"
              : "Enter PIN"}
          </Text>
          <View style={styles.dotRow}>
            {Array.from({
              length:
                isSetup && activeField === "confirm"
                  ? pin.length || 4
                  : pinLength || 4,
            }).map((_, index) => {
              const currentVal =
                isSetup && activeField === "confirm" ? confirmPin : pin;
              const isFilled = index < currentVal.length;
              return (
                <View
                  key={`dot-${index}`}
                  style={[styles.pinDot, isFilled && styles.pinDotFilled]}
                />
              );
            })}
          </View>
          <View style={styles.errorContainer}>
            <Text
              style={[
                styles.error,
                !pinLocked && !error ? styles.errorHidden : null,
              ]}
            >
              {pinLocked
                ? `Too many attempts. Try again in ${String(
                    Math.max(0, lockoutTimer)
                  ).padStart(2, "0")}s.`
                : error || " "}
            </Text>
          </View>
        </View>

        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            {[1, 2, 3].map((digit) => (
              <Pressable
                key={`digit-${digit}`}
                style={({ pressed }) => [
                  styles.keypadButton,
                  pressed && styles.keypadButtonPressed,
                ]}
                onPress={() => handleDigit(digit)}
                accessibilityLabel={`Digit ${digit}`}
              >
                <Text style={styles.keypadText}>{digit}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {[4, 5, 6].map((digit) => (
              <Pressable
                key={`digit-${digit}`}
                style={({ pressed }) => [
                  styles.keypadButton,
                  pressed && styles.keypadButtonPressed,
                ]}
                onPress={() => handleDigit(digit)}
                accessibilityLabel={`Digit ${digit}`}
              >
                <Text style={styles.keypadText}>{digit}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {[7, 8, 9].map((digit) => (
              <Pressable
                key={`digit-${digit}`}
                style={({ pressed }) => [
                  styles.keypadButton,
                  pressed && styles.keypadButtonPressed,
                ]}
                onPress={() => handleDigit(digit)}
                accessibilityLabel={`Digit ${digit}`}
              >
                <Text style={styles.keypadText}>{digit}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {biometricAvailable && hasPin && biometricEnabled ? (
              <Pressable
                style={({ pressed }) => [
                  styles.keypadButton,
                  styles.keypadButtonGhost,
                  pressed && styles.keypadButtonPressed,
                ]}
                onPress={handleBiometric}
                accessibilityLabel="Unlock with biometrics"
              >
                <Ionicons
                  name="finger-print"
                  size={28}
                  color={theme.colors.ink}
                />
              </Pressable>
            ) : (
              <View style={styles.keypadButtonPlaceholder} />
            )}
            <Pressable
              style={({ pressed }) => [
                styles.keypadButton,
                pressed && styles.keypadButtonPressed,
              ]}
              onPress={() => handleDigit(0)}
              accessibilityLabel="Digit 0"
            >
              <Text style={styles.keypadText}>0</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.keypadButton,
                styles.keypadButtonGhost,
                pressed && styles.keypadButtonPressed,
              ]}
              onPress={handleBackspace}
              accessibilityLabel="Backspace"
            >
              <Ionicons
                name="backspace-outline"
                size={24}
                color={theme.colors.ink}
              />
            </Pressable>
          </View>
        </View>

        <View style={{ height: theme.spacing.lg }} />
      </View>
    </Screen>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: theme.spacing.xl,
    },
    panel: {
      marginTop: theme.spacing.lg,
    },
    kicker: {
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontSize: responsiveFontSize(12),
    },
    title: {
      fontSize: responsiveFontSize(32),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    subtitle: {
      marginTop: theme.spacing.xs,
      color: theme.colors.muted,
      fontFamily: theme.font.regular,
      maxWidth: responsiveSpacing(260),
    },
    pinContainer: {
      alignItems: "center",
      marginTop: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    pinTitle: {
      fontSize: responsiveFontSize(18),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      marginBottom: theme.spacing.sm,
    },
    dotRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: responsiveSpacing(24),
      minHeight: responsiveSpacing(24),
    },
    pinDot: {
      width: responsiveSpacing(14),
      height: responsiveSpacing(14),
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: theme.colors.ink,
    },
    pinDotFilled: {
      backgroundColor: theme.colors.ink,
    },
    errorContainer: {
      minHeight: responsiveSpacing(20),
      justifyContent: "center",
    },
    error: {
      color: theme.colors.danger,
      fontFamily: theme.font.regular,
      fontSize: responsiveFontSize(14),
      marginTop: theme.spacing.sm,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    errorHidden: {
      opacity: 0,
    },
    keypad: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.md,
      alignItems: "center",
    },
    keypadRow: {
      flexDirection: "row",
      gap: responsiveSpacing(20),
    },
    keypadButton: {
      width: responsiveSpacing(75),
      height: responsiveSpacing(75),
      borderRadius: 38,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceTint,
    },
    keypadButtonGhost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    keypadButtonPressed: {
      backgroundColor: theme.colors.outline,
      opacity: 0.7,
    },
    keypadText: {
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
      fontSize: responsiveFontSize(28),
    },
    keypadButtonPlaceholder: {
      width: responsiveSpacing(75),
    },
    spacer: {
      flex: 1,
    },
  });
