import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

import { AppModal } from "../../../../components/AppModal";
import { BlurView } from "expo-blur";

import { useTheme } from "../../../../utils/useTheme";
import { responsiveFontSize } from "../../../../utils/responsive";

type ConfirmResetModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmResetModal({
  visible,
  onCancel,
  onConfirm,
}: ConfirmResetModalProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <BlurView intensity={20} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Reset Vault?</Text>
          <Text style={styles.modalBody}>
            This will permanently delete all cards and vault encryption keys on
            this device. Your PIN and biometric settings will remain. This
            cannot be undone unless you have a backup.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalGhost} onPress={onCancel}>
              <Text style={styles.modalGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDanger} onPress={onConfirm}>
              <Text style={styles.modalDangerText}>Reset Vault</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </AppModal>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.xl,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalCard: {
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 10,
    },
    modalTitle: {
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      fontSize: responsiveFontSize(20),
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    modalBody: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      fontSize: responsiveFontSize(15),
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    modalActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    modalGhost: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      backgroundColor: theme.colors.surfaceTint,
    },
    modalGhostText: {
      color: theme.colors.ink,
      fontFamily: theme.font.bold,
    },
    modalDanger: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      backgroundColor: theme.colors.danger,
    },
    modalDangerText: {
      color: theme.colors.surface,
      fontFamily: theme.font.bold,
    },
  });
