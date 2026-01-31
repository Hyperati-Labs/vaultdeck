import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../../../utils/useTheme";
import { getSettingsStyles } from "../../settingsStyles";
import {
  type AccentKey,
  ACCENT_PALETTES,
  ACCENT_LABELS,
} from "../../../../utils/theme";
import {
  responsiveFontSize,
  responsiveSpacing,
} from "../../../../utils/responsive";

type AccentColorPickerModalProps = {
  visible: boolean;
  value: AccentKey;
  onSelect: (key: AccentKey) => void;
  onClose: () => void;
};

const ACCENT_KEYS: AccentKey[] = [
  "amber",
  "blue",
  "green",
  "violet",
  "rose",
  "teal",
];

export function AccentColorPickerModal({
  visible,
  value,
  onSelect,
  onClose,
}: AccentColorPickerModalProps) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const localStyles = getLocalStyles(theme);
  const mode = theme.isDark ? "dark" : "light";

  const handleSelect = (key: AccentKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.modalCard}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.modalTitle}>Accent color</Text>
          <View style={localStyles.swatchGrid}>
            {ACCENT_KEYS.map((key) => {
              const accentColor = ACCENT_PALETTES[key][mode].accent;
              const selected = key === value;
              return (
                <TouchableOpacity
                  key={key}
                  style={localStyles.swatchWrap}
                  onPress={() => handleSelect(key)}
                  activeOpacity={0.8}
                  accessibilityLabel={`${ACCENT_LABELS[key]}, ${selected ? "selected" : ""}`}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      localStyles.swatch,
                      { backgroundColor: accentColor },
                      selected && localStyles.swatchSelected,
                    ]}
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={responsiveFontSize(16)}
                        color="#fff"
                      />
                    ) : null}
                  </View>
                  <Text style={localStyles.swatchLabel}>
                    {ACCENT_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.modalActions, { marginTop: theme.spacing.md }]}>
            <TouchableOpacity style={styles.modalGhost} onPress={onClose}>
              <Text style={styles.modalGhostText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getLocalStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    swatchGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
      justifyContent: "center",
    },
    swatchWrap: {
      alignItems: "center",
      gap: theme.spacing.xs,
      minWidth: responsiveSpacing(72),
    },
    swatch: {
      width: responsiveSpacing(44),
      height: responsiveSpacing(44),
      borderRadius: responsiveSpacing(22),
      borderWidth: 2,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    swatchSelected: {
      borderColor: theme.colors.ink,
    },
    swatchLabel: {
      fontSize: responsiveFontSize(11),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
    },
  });
