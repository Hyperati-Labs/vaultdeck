import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../utils/useTheme";
import { responsiveFontSize } from "../utils/responsive";

type BackButtonProps = {
  onPress?: () => void;
  style?: ViewStyle;
};

export default function BackButton({ onPress, style }: BackButtonProps) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => router.back())}
      style={[styles.button, style]}
      accessibilityLabel="Back"
    >
      <Ionicons name="chevron-back" size={18} color={theme.colors.ink} />
      <Text style={styles.text}>Back</Text>
    </TouchableOpacity>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surfaceTint,
    },
    text: {
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      fontSize: responsiveFontSize(12),
    },
  });
