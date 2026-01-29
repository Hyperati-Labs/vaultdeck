import { Modal, TouchableOpacity, View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../../utils/useTheme";
import { getSettingsStyles } from "../../settingsStyles";

export type PickerOption<T> = { label: string; value: T };

type OptionPickerModalProps<T> = {
  title: string;
  visible: boolean;
  options: PickerOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function OptionPickerModal<T>({
  title,
  visible,
  options,
  value,
  onSelect,
  onClose,
}: OptionPickerModalProps<T>) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{
              gap: theme.spacing.xs,
              paddingBottom: theme.spacing.md,
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <TouchableOpacity
                  key={String(opt.label)}
                  style={[
                    styles.row,
                    {
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: active
                        ? theme.colors.accent
                        : theme.colors.outline,
                      backgroundColor: active
                        ? theme.colors.surfaceTint
                        : theme.colors.surface,
                    },
                  ]}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.rowLabel,
                      { flex: 1, color: theme.colors.ink },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.colors.accent}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={[styles.modalActions, { marginTop: theme.spacing.sm }]}>
            <TouchableOpacity style={styles.modalGhost} onPress={onClose}>
              <Text style={styles.modalGhostText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
