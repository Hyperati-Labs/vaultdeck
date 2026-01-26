import { Modal, Text, View, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "../../../../utils/useTheme";
import { getSettingsStyles } from "../../settingsStyles";

type BackupSuccessModalProps = {
  message: string | null;
  onDismiss: () => void;
};

export function BackupSuccessModal({
  message,
  onDismiss,
}: BackupSuccessModalProps) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);

  if (!message) return null;

  return (
    <Modal visible={Boolean(message)} transparent animationType="fade">
      <BlurView intensity={20} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Backup</Text>
          <Text style={styles.modalBody}>{message}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalGhost} onPress={onDismiss}>
              <Text style={styles.modalGhostText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}
