import { useMemo } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TAG_COLOR_PRESETS } from "../utils/tagColors";
import { useTheme } from "../utils/useTheme";
import { responsiveFontSize, responsiveSpacing } from "../utils/responsive";

type TagColorPickerProps = {
  visible: boolean;
  tag: string | null;
  currentColor?: string;
  onSelect: (color: string) => void;
  onReset: () => void;
  onClose: () => void;
};

export function TagColorPicker({
  visible,
  tag,
  currentColor,
  onSelect,
  onReset,
  onClose,
}: TagColorPickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  if (!tag) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>Color for #{tag}</Text>
          <View style={styles.swatchRow}>
            {TAG_COLOR_PRESETS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  currentColor === color && styles.swatchSelected,
                ]}
                onPress={() => onSelect(color)}
                activeOpacity={0.8}
              />
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionGhost} onPress={onReset}>
              <Text style={styles.actionGhostText}>Reset to smart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPrimary} onPress={onClose}>
              <Text style={styles.actionPrimaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    sheet: {
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 18,
      elevation: 8,
    },
    title: {
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      fontSize: responsiveFontSize(16),
    },
    swatchRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    swatch: {
      width: responsiveSpacing(38),
      height: responsiveSpacing(38),
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "transparent",
    },
    swatchSelected: {
      borderColor: theme.colors.ink,
    },
    actions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    actionGhost: {
      paddingVertical: responsiveSpacing(10),
      paddingHorizontal: responsiveSpacing(14),
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    actionGhostText: {
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    actionPrimary: {
      paddingVertical: responsiveSpacing(10),
      paddingHorizontal: responsiveSpacing(16),
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
    },
    actionPrimaryText: {
      fontFamily: theme.font.bold,
      color: theme.colors.surface,
    },
  });
