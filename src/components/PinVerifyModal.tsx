import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppModal } from "./AppModal";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../state/authStore";
import { useTheme } from "../utils/useTheme";
import { responsiveFontSize, responsiveSpacing } from "../utils/responsive";

const PIN_LENGTH = 4;

type PinVerifyModalProps = {
  visible: boolean;
  title?: string;
  onCancel: () => void;
  onVerified: () => void;
};

export function PinVerifyModal({
  visible,
  title = "Enter PIN",
  onCancel,
  onVerified,
}: PinVerifyModalProps) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const { verifyPin, pinLocked, pinLockoutRemainingMs, checkPinLockout } =
    useAuthStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isVerifying = useRef(false);

  useEffect(() => {
    if (!visible) {
      setPin("");
      setError("");
      setBusy(false);
      isVerifying.current = false;
      return;
    }
    checkPinLockout();
  }, [visible, checkPinLockout]);

  const handleDigit = async (digit: number) => {
    if (busy || pinLocked || pin.length >= PIN_LENGTH) {
      return;
    }
    const next = `${pin}${digit}`;
    setPin(next);
    setError("");
    if (next.length < PIN_LENGTH) {
      return;
    }
    if (isVerifying.current) {
      return;
    }
    isVerifying.current = true;
    setBusy(true);
    try {
      const result = await verifyPin(next);
      if (result.success) {
        setPin("");
        onVerified();
        return;
      }
      setPin("");
      setError(result.resiliency?.error ?? "Incorrect PIN.");
    } finally {
      isVerifying.current = false;
      setBusy(false);
    }
  };

  const handleBackspace = () => {
    if (busy || pinLocked) {
      return;
    }
    setPin((current) => current.slice(0, -1));
    setError("");
  };

  const lockoutSeconds = Math.ceil(pinLockoutRemainingMs / 1000);

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onCancel} accessibilityLabel="Cancel">
              <Ionicons name="close" size={24} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.dotRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.pinDot,
                  index < pin.length && styles.pinDotFilled,
                ]}
              />
            ))}
          </View>

          <Text style={styles.error}>
            {pinLocked
              ? `Too many attempts. Try again in ${lockoutSeconds}s.`
              : error || " "}
          </Text>

          <View style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Pressable
                key={`digit-${digit}`}
                style={({ pressed }) => [
                  styles.keypadButton,
                  pressed && styles.keypadButtonPressed,
                ]}
                onPress={() => handleDigit(digit)}
                disabled={busy || pinLocked}
              >
                <Text style={styles.keypadText}>{digit}</Text>
              </Pressable>
            ))}
            <View style={styles.keypadButtonPlaceholder} />
            <Pressable
              style={({ pressed }) => [
                styles.keypadButton,
                pressed && styles.keypadButtonPressed,
              ]}
              onPress={() => handleDigit(0)}
              disabled={busy || pinLocked}
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
              disabled={busy || pinLocked}
            >
              <Ionicons
                name="backspace-outline"
                size={22}
                color={theme.colors.ink}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </AppModal>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.xl,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    card: {
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(18),
      color: theme.colors.ink,
    },
    dotRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: responsiveSpacing(16),
      marginBottom: theme.spacing.sm,
    },
    pinDot: {
      width: responsiveSpacing(14),
      height: responsiveSpacing(14),
      borderRadius: responsiveSpacing(7),
      borderWidth: 2,
      borderColor: theme.colors.outline,
    },
    pinDotFilled: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    error: {
      fontFamily: theme.font.regular,
      fontSize: responsiveFontSize(13),
      color: theme.colors.danger,
      textAlign: "center",
      minHeight: responsiveSpacing(20),
      marginBottom: theme.spacing.sm,
    },
    keypad: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: responsiveSpacing(10),
    },
    keypadButton: {
      width: "28%",
      aspectRatio: 1.4,
      maxWidth: responsiveSpacing(88),
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surfaceTint,
      alignItems: "center",
      justifyContent: "center",
    },
    keypadButtonGhost: {
      backgroundColor: "transparent",
    },
    keypadButtonPressed: {
      opacity: 0.7,
    },
    keypadButtonPlaceholder: {
      width: "28%",
      maxWidth: responsiveSpacing(88),
    },
    keypadText: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(22),
      color: theme.colors.ink,
    },
  });
