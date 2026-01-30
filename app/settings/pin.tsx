import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import Screen from "../../src/components/Screen";
import BackButton from "../../src/components/BackButton";
import { useAuthStore } from "../../src/state/authStore";
import { useTheme } from "../../src/utils/useTheme";
import {
  responsiveFontSize,
  responsiveSpacing,
} from "../../src/utils/responsive";

const PIN_LENGTH = 4;

type Step = "current" | "next" | "confirm";

export default function ChangePinScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { updatePin, verifyPin, pinLength: storedPinLength } = useAuthStore();

  const [step, setStep] = useState<Step>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isMounted = useRef(true);
  const isVerifying = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (busy && !isVerifying.current) {
      return;
    }

    const processStep = async () => {
      if (step === "current") {
        const targetLength = PIN_LENGTH;
        if (currentPin.length < targetLength) return;

        setBusy(true);
        isVerifying.current = true;
        try {
          const ok = await verifyPin(currentPin);
          if (ok) {
            setStep("next");
            setError("");
          } else {
            setError("Incorrect current PIN.");
            setCurrentPin("");
          }
        } finally {
          isVerifying.current = false;
          if (isMounted.current) setBusy(false);
        }
      } else if (step === "next") {
        if (nextPin.length === PIN_LENGTH) {
          setStep("confirm");
          setError("");
          return;
        }
        if (nextPin.length >= PIN_LENGTH) {
          const timer = setTimeout(() => {
            if (isMounted.current) {
              setStep("confirm");
              setError("");
            }
          }, 0);
          return () => clearTimeout(timer);
        }
      } else if (step === "confirm") {
        if (confirmPin.length === nextPin.length) {
          if (confirmPin === nextPin) {
            setBusy(true);
            isVerifying.current = true;
            try {
              const ok = await updatePin(currentPin, nextPin);
              if (ok) {
                setShowSuccess(true);
              } else {
                setError("Failed to update PIN.");
                setStep("current");
                setCurrentPin("");
                setNextPin("");
                setConfirmPin("");
              }
            } finally {
              isVerifying.current = false;
              if (isMounted.current) setBusy(false);
            }
          } else {
            setError("PINs do not match. Starting over.");
            setConfirmPin("");
            setNextPin("");
            setStep("next");
          }
        }
      }
    };

    processStep();
  }, [busy, currentPin, nextPin, confirmPin, step, verifyPin, updatePin]);

  const handleDigit = (digit: number) => {
    if (busy) return;
    setError("");
    if (step === "current") {
      if (currentPin.length < PIN_LENGTH) {
        setCurrentPin((prev) => prev + String(digit));
      }
    } else if (step === "next") {
      if (nextPin.length < PIN_LENGTH) {
        setNextPin((prev) => prev + String(digit));
      }
    } else if (step === "confirm") {
      if (confirmPin.length < nextPin.length) {
        setConfirmPin((prev) => prev + String(digit));
      }
    }
  };

  const handleBackspace = () => {
    if (busy) return;
    if (step === "current") {
      setCurrentPin((prev) => prev.slice(0, -1));
    } else if (step === "next") {
      setNextPin((prev) => prev.slice(0, -1));
    } else if (step === "confirm") {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleNextStep = () => {
    if (step === "next" && nextPin.length >= PIN_LENGTH) {
      setStep("confirm");
    }
  };

  const getActivePin = () => {
    if (step === "current") return currentPin;
    if (step === "next") return nextPin;
    return confirmPin;
  };

  const getTargetLength = () => {
    if (step === "current") return storedPinLength ?? 4;
    if (step === "next") return 4; // Placeholder for dots
    return nextPin.length;
  };

  const getTitle = () => {
    if (step === "current") return "Enter current PIN";
    if (step === "next") return "Enter new PIN";
    return "Confirm new PIN";
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerSpacer} />
          <View style={styles.titleGroup}>
            <Text style={styles.kicker}>Security</Text>
            <Text style={styles.title}>Change PIN</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.pinContainer}>
          <Text style={styles.pinTitle}>{getTitle()}</Text>
          <View style={styles.dotRow}>
            {Array.from({ length: getTargetLength() }).map((_, index) => {
              const activePin = getActivePin();
              const isFilled = index < activePin.length;
              return (
                <View
                  key={`dot-${index}`}
                  style={[styles.pinDot, isFilled && styles.pinDotFilled]}
                />
              );
            })}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
            {step === "next" ? (
              <Pressable
                style={({ pressed }) => [
                  styles.keypadButton,
                  styles.keypadButtonGhost,
                  nextPin.length < PIN_LENGTH && styles.disabled,
                  pressed && styles.keypadButtonPressed,
                ]}
                onPress={handleNextStep}
                disabled={nextPin.length < PIN_LENGTH}
                accessibilityLabel="Next step"
              >
                <Ionicons
                  name="arrow-forward-circle-outline"
                  size={32}
                  color={
                    nextPin.length < PIN_LENGTH
                      ? theme.colors.muted
                      : theme.colors.ink
                  }
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

        <Modal visible={showSuccess} transparent animationType="fade">
          <BlurView intensity={20} style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalContent}>
                <View style={styles.successIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color={theme.colors.accent}
                  />
                </View>
                <Text style={styles.modalTitle}>PIN Updated</Text>
                <Text style={styles.modalBody}>
                  Your security PIN has been successfully changed and is now
                  active.
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowSuccess(false);
                    router.back();
                  }}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    headerSpacer: {
      flex: 1,
    },
    titleGroup: {
      alignItems: "flex-end",
    },
    title: {
      fontSize: responsiveFontSize(26),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    kicker: {
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontSize: responsiveFontSize(12),
    },
    spacer: {
      flex: 1,
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
      borderRadius: responsiveSpacing(7),
      borderWidth: 1.5,
      borderColor: theme.colors.ink,
    },
    pinDotFilled: {
      backgroundColor: theme.colors.ink,
    },
    error: {
      color: theme.colors.danger,
      fontFamily: theme.font.regular,
      fontSize: responsiveFontSize(14),
      marginTop: theme.spacing.sm,
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
      borderRadius: responsiveSpacing(38),
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
    disabled: {
      opacity: 0.3,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
    },
    modalCard: {
      width: "100%",
      maxWidth: responsiveSpacing(340),
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    modalContent: {
      padding: theme.spacing.xl,
      alignItems: "center",
    },
    successIcon: {
      marginBottom: theme.spacing.md,
    },
    modalTitle: {
      fontSize: responsiveFontSize(22),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      textAlign: "center",
    },
    modalBody: {
      fontSize: responsiveFontSize(16),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
      lineHeight: responsiveFontSize(22),
    },
    modalButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.radius.md,
      width: "100%",
      alignItems: "center",
    },
    modalButtonText: {
      color: theme.colors.surface,
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(16),
    },
  });
